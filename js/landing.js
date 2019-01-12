
class MapView {
    constructor(canvasElement) {
        this.canvas = canvasElement
        // hide the canvas until asset loading completes
        // this.canvas.style.display = 'none'
        this.ctx    = this.canvas.getContext('2d')

        this.assetsLoaded = false
        this.shouldDraw = false
        this.stitchedImage = new Image()
    }   

    loadAssets() {
        /**
         * Our end goal is to get a stitched image of a map view
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

        // ideally we want like 2x as many tiles as screen res
        // the *2 is the zoom level 
        let tiles_width = (4096/128)*2
        let tiles_height = (2048/128)*2


        // note again zoom level 2
        this.tilesDrawWidth = (tiles_width*128)/2
        this.tilesDrawHeight = (tiles_height*128)/2


        // we're gonna keep the camera focused on the center of the tile image
        this.currentPoint = {
            x: this.tilesDrawWidth / 2,
            y: this.tilesDrawHeight / 2
        }

        
        // so we can draw each of the tiles onto the canvas and stitch them
        this.canvas.width = this.tilesDrawWidth
        this.canvas.height = this.tilesDrawHeight

        // the top left, bottom right in tile coordinates
        let topleft_x = 100 - (tiles_width/2)
        let topleft_y = 38 + (tiles_height/2)

        let bottomright_x = 100 + (tiles_width/2)
        let bottomright_y = 38 - (tiles_height/2)
 

        for(let y = topleft_y; y >= bottomright_y; y -= 2) {
            for(let x = topleft_x; x <= bottomright_x; x += 2) {

                // keep it centered while loading (i.e if people resize their browser)
                this.cvs = this.getCurrentViewportSize()
                this.canvas.style.top = `-${(this.tilesDrawHeight/2) - (this.cvs.y/2)}px`
                this.canvas.style.left = `-${(this.tilesDrawWidth/2) - (this.cvs.x/2)}px`
        

                // console.log(x,y,bottomright_y)
                let tile = new Image()

                // see comment about row placement below
                let self = this
                // get canvas coordinates 
                tile.addEventListener(
                    'load',
                    () => {
                        let canvas_x  = ((x - topleft_x) / 2)*128
                        let canvas_y  = ((topleft_y - y) / 2)*128
                        self.ctx.drawImage(
                            tile, 
                            canvas_x,
                            canvas_y,
                            128,
                            128
                        )

                        // final iteration
                        if(x >= bottomright_x && y <= bottomright_y) {
                            self.assetsLoaded = true
                        }
                    },
                    false
                )

                tile.src = `http://minecraft.netsoc.co/maps/survival/tiles/world/t/3_1/z_${x}_${y}.png`

            }
        }

        //http = new XMLHttpRequest()
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

            this.targetPoint = {
                x: Math.floor(Math.random()*this.tilesDrawWidth),
                y: Math.floor(Math.random()*this.tilesDrawHeight)
            }
            console.log(this.targetPoint)
            this.currentPoint = {
                x: this.tilesDrawWidth / 2,
                y: this.tilesDrawHeight / 2
            }
            this.ratio = 0
            this.shouldAnimate = true
            this.canvas.className += " visible";
        }

        if(this.shouldAnimate) {
            this.cvs = this.getCurrentViewportSize()
            this.canvas.style.top = `-${(this.currentPoint.y) - (this.cvs.y/2)}px`
            this.canvas.style.left = `-${(this.currentPoint.x) - (this.cvs.x/2)}px`
    

            if(this.ratio < 0.98) {
                console.log('beziering')
                this.currentPoint = bezier(this.currentPoint, 
                    { x: this.currentPoint.x + 20, y: this.currentPoint.y - 20} , 
                        this.targetPoint, this.ratio)
                this.ratio += 0.0001
            } else {

            }
        }

        window.requestAnimationFrame(mapView.draw.bind(this))
    }

}

function bezier(startXY, controlXY, endXY, ratio) {
    // i imple
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