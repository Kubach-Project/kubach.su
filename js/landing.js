
class MapView {
    constructor(canvasElement) {
        this.ctx = canvasElement.getContext('2d')

        this.map = [[
            
        ]]
    }   

    loadAssets() {

    }
    
    draw() {

        window.requestAnimationFrame(MapView.draw.bind(this))
    }

}

document.onload = () => {
    canvasElement = document.getElementById("map")

    if(canvasElement) {
        mapView = new MapView(canvasElement)

        window.requestAnimationFrame(MapView.draw.bind(mapView))
    }
}