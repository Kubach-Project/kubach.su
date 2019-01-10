
class MapView {
    constructor(canvasElement) {
        this.canvas = canvasElement
        // hide the canvas until asset loading completes
        this.canvas.style.display = 'none'
        this.ctx    = this.canvas.getContext('2d')
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
        let scr_height = window.screen.height
        let scr_width  = window.screen.width

        // ideally we want like 2x as many tiles as screen res
        let tiles_width = (scr_width*2)/128 
        let tiles_height = (scr_height*2)/128
        
        console.log(tiles_width,tiles_height)

        // make sure they're even as we're using zoom level 1
        tiles_width = tiles_width - (tiles_width%2)
        tiles_height = tiles_height - (tiles_height%2)
    

        // Okay so we're centering around 100,40 so we need to get tiles at either side of this
        this.requests = { }
        for(let y = 100 - (tiles_width/2); y < 100 + (tiles_height/2); y += 2){
            for(let x = 40 - (tiles_height)/2; x < 40 + (tiles_height/2); x += 2){
                
                let request = new XMLHttpRequest()
                request.responseType = 'arraybuffer'
                request.open(
                    'GET',
                    `http://minecraft.netsoc.co/maps/survival/tiles/world/t/3_1/z_${x}_${y}`,
                    true
                )
                
                
                request.onreadystatechange = () => {
                    if(request.readyState === 4 && request.status === 200) {
                        let image = new Image();
                        

                        image.onload = () => {
                            
                        }
                        // https://stackoverflow.com/a/42929211
                        image.src = 'data:image/png;base64,' + btoa(String.fromCharCode.apply(null, new Uint8Array(request.response)))
                        console.log(xhr.responseText);
                    }
                }

                request.send()
                this.requests.push(request)
            }
        }

        //http = new XMLHttpRequest()
    }
    
    draw() {

        window.requestAnimationFrame(MapView.draw.bind(this))
    }

}

window.onload = function() {
    canvasElement = document.getElementById("map")

    if(canvasElement) {
        mapView = new MapView(canvasElement)
        mapView.loadAssets()
                //window.requestAnimationFrame(MapView.draw.bind(mapView))
    }
}