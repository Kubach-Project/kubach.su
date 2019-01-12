
class MapView {
    constructor(canvasElement) {
        this.canvas = canvasElement
        this.ctx  = this.canvas.getContext('2d')

        this.assetsLoaded = false
        this.shouldDraw = false
    }   

    loadAssets() {
        /**
         * Our end goal is to get a stitched image of a map view on the canvas
         * We will then be able to transform it as we wish
         * 
         * Minecraft Dynmap saves map tiles in a regular pattern 
         * 
         * e.g. (the tile at 0, 0) with zoom specified by the number of z's
         * http://minecraft.netsoc.co/maps/survival/tiles/world/t/3_1/z_0_0.png
         * 
         * At zoom level 1 (one z), the tiles are only even numbers, e.g. z_2_2
         * z_0_0, z_4_2, etc...
         */

        // Our center: http://minecraft.netsoc.co/maps/survival/tiles/world/t/3_1/z_100_40.png
        // Each tile is 128x128
   
        // screen res:
        // the *2 is due to zoom level 
        let tiles_width = (4096/128)*2
        let tiles_height = (2048/128)*2

        // note again zoom level 2
        this.stitchedTilesSize = {
            x: (tiles_width*128)/2,
            y: (tiles_height*128)/2
        }

        // we're gonna keep the camera focused on the center of all the tiles we get
        this.currentPoint = {
            x: this.stitchedTilesSize.x / 2,
            y: this.stitchedTilesSize.y / 2
        }

        // so we can draw each of the tiles onto the canvas and stitch them
        this.canvas.width = this.stitchedTilesSize.x
        this.canvas.height = this.stitchedTilesSize.y

        // the top left, bottom right in tile coordinates, our centre point is (100,38)
        let topleft_x = 100 - (tiles_width/2)
        let topleft_y = 38 + (tiles_height/2)

        let bottomright_x = 100 + (tiles_width/2)
        let bottomright_y = 38 - (tiles_height/2)
 
        for(let y = topleft_y; y >= bottomright_y; y -= 2) {
            for(let x = topleft_x; x <= bottomright_x; x += 2) {

                // keep it centered while loading (i.e if people resize their browser)
                this.cvs = this.getCurrentViewportSize()
                this.canvas.style.top = `-${(this.stitchedTilesSize.y/2) - (this.cvs.y/2)}px`
                this.canvas.style.left = `-${(this.stitchedTilesSize.x/2) - (this.cvs.x/2)}px`
    
                let tile = new Image()

                let self = this

                // when the image finishes loading (after we set src)
                tile.addEventListener(
                    'load',
                    () => {
                        // convert global tile coords to local ones, then convert to pixels (*128)
                        let canvas_x  = ((x - topleft_x) / 2)*128
                        let canvas_y  = ((topleft_y - y) / 2)*128

                        // draw on the canvas
                        self.ctx.drawImage(
                            tile, 
                            canvas_x,
                            canvas_y,
                            128,
                            128
                        )

                        // on final iteration of the loop
                        if(x >= bottomright_x && y <= bottomright_y) {
                            // this will trigger our draw code below
                            self.assetsLoaded = true
                        }
                    },
                    false
                )

                tile.src = `http://minecraft.netsoc.co/maps/survival/tiles/world/t/3_1/z_${x}_${y}.png`
            }
        }
    }
    
    getCurrentViewportSize() {
        return { 
            x: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
            y: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        }
    }

    draw() {
        if(this.assetsLoaded && !this.shouldAnimate) {
            // So, putImageData/getImageData only works on pixels that are displayed on the visible canvas
            // this means we cannot copy our stitched image from above
            // (if we wanted to have the image draw from the center of the viewport)
            // so we're just gonna manipulate it with CSS positioning instead

            this.cvs = this.getCurrentViewportSize()

            // get a random point to interpolate to (and make sure the current screen res will fit in it too)
            this.targetPoint = {
                x: (this.cvs.x/2)+Math.floor(Math.random()*(this.stitchedTilesSize.x-this.cvs.x)),
                y: (this.cvs.y/2)+Math.floor(Math.random()*(this.stitchedTilesSize.y-this.cvs.y))
            }

            // we're gonna start from the center of the stitched tile image
            this.currentPoint = {
                x: this.stitchedTilesSize.x / 2,
                y: this.stitchedTilesSize.y / 2
            }

            // trigger animation from now on
            this.shouldAnimate = true

            // also fade it in
            this.canvas.className += " visible";
        }

        if(this.shouldAnimate) {
            // position it based on the point we're going to
            this.cvs = this.getCurrentViewportSize()
            this.canvas.style.top = `-${(this.currentPoint.y) - (this.cvs.y/2)}px`
            this.canvas.style.left = `-${(this.currentPoint.x) - (this.cvs.x/2)}px`
    
            // if we're more than 185px away
            if(Math.sqrt(
                Math.pow(this.targetPoint.x-this.currentPoint.x,2) + 
                Math.pow(this.targetPoint.y - this.currentPoint.y,2)) > 185) {
     
                // bezier interpolate to our target
                this.currentPoint = bezier(
                    this.currentPoint, 
                    // I thought I could use a control point with a slight x,y offset,
                    // unfortunately this pushes the canvas out of bounds :(
                    { x: this.currentPoint.x, y: this.currentPoint.y }, 
                    this.targetPoint, 0.025
                )

            } else {
                // if we reached our destination 

                // pick a new random (make sure its a good distance away like 250px
                while(Math.sqrt(
                    Math.pow(this.targetPoint.x-this.currentPoint.x,2) + 
                    Math.pow(this.targetPoint.y - this.currentPoint.y,2)) < 350) {
                    
                    this.targetPoint = {
                        x: (this.cvs.x/2)+Math.floor(Math.random()*(this.stitchedTilesSize.x-this.cvs.x)),
                        y: (this.cvs.y/2)+Math.floor(Math.random()*(this.stitchedTilesSize.y-this.cvs.y))
                    }
                }
            }
        }

        window.requestAnimationFrame(mapView.draw.bind(this))
    }
}

// bezier interp between 2 x,y coordinates with a control point
function bezier(startXY, controlXY, endXY, ratio) {
    return {
        x: Math.pow((1-ratio),2) * startXY.x + (2 * (1-ratio) * ratio * controlXY.x) + Math.pow(ratio,2) * endXY.x,
        y: Math.pow((1-ratio),2) * startXY.y + (2 * (1-ratio) * ratio * controlXY.y) + Math.pow(ratio,2) * endXY.y
    }
}

window.onload = function() {
    canvasElement = document.getElementById("map")

    if(canvasElement) {
        mapView = new MapView(canvasElement)
        mapView.loadAssets()
        window.requestAnimationFrame(mapView.draw.bind(mapView))
    }
}