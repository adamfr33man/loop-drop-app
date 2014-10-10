var h = require('mercury').h
var MPE = require('./mouse-position-event')
var getBaseName = require('path').basename
module.exports = renderGrid
function renderGrid(data, controller, fileObject){
  if (data){
    var grid = data.grid
    var chunks = data.chunks

    if (grid && chunks){
      var buttons = []
      var length = grid.shape[0] * grid.shape[1]
      for (var r=0;r<grid.shape[0];r++){
        for (var c=0;c<grid.shape[1];c++){
          var classes = '.button'
          var buttonState = grid.get(r,c)
          if (buttonState){
            classes += ' -present'
            if (buttonState.isPlaying) classes += ' -playing'
            if (buttonState.isRecording) classes += ' -recording'
            if (buttonState.isActive) classes += ' -active'
            if (buttonState.noRepeat) classes += ' -noRepeat'
          }

          buttons.push(h('div', {
            className: classes
          }))
        }
      }

      return h('div', {
        className: '.grid',
        'ev-dragover': MPE(dragOver, {controller: controller, setup: fileObject}),
        'ev-drop': MPE(drop, {controller: controller, setup: fileObject})
      }, [
        buttons,
        chunks.map(function(chunk){
          return renderChunkBlock(chunk, grid.shape, grid.stride, controller)
        })
      ])
    }
  }
}

function renderChunkBlock(chunk, shape, stride, controller){
  var box = {
    top: chunk.origin[0] / shape[0],
    bottom: (chunk.origin[0] + chunk.shape[0]) / shape[0],
    left: chunk.origin[1] / shape[0],
    right: (chunk.origin[1] + chunk.shape[1]) / shape[1]
  }
  var classes = '.chunk'

  if (chunk.isSelected){
    classes += ' -selected'
  }

  var style = 'top:'+percent(box.top)+
              ';height:'+percent(box.bottom - box.top)+
              ';left:'+percent(box.left)+
              ';width:'+percent(box.right - box.left)+
              ';border-color:'+color(chunk.color, 1)+
              ';background-color:'+color(chunk.color, 0.1)+
              ';color:'+color(mixColor(chunk.color, [255,255,255]),1)

  return h('div', { 
    className: classes, 
    style: AttributeHook(style),
    draggable: 'draggable',
    'ev-dragstart': MPE(startDrag, {chunk: chunk, controller: controller}),
    'ev-dragend': MPE(endDrag, {chunk: chunk, controller: controller})
  },[
    h('span', {className: '.label'}, chunk.id),
    h('div', {className: '.handle -top'}),
    h('div', {className: '.handle -bottom'}),
    h('div', {className: '.handle -left'}),
    h('div', {className: '.handle -right'}),
    h('div', {className: '.handle -move'})
  ])
}

var currentDrag = null
function startDrag(ev){
  currentDrag = ev
  ev.value = ev.data.chunk.origin.slice()
  ev.controller = ev.data.controller
  console.log('start', ev)
}
function endDrag(ev){
  currentDrag = null
}

function dragOver(ev){
  if (currentDrag){

    var height = ev.offsetHeight / ev.data.controller.grid().shape[0]
    var width = ev.offsetWidth / ev.data.controller.grid().shape[1]

    if (currentDrag.controller !== ev.data.controller){
      currentDrag.controller = ev.data.controller
      currentDrag.controller.chunkPositions.delete(currentDrag.data.chunk.id)
    }

    if (ev.offsetX < 0 || ev.offsetY < 0  
    ||  ev.offsetX > ev.offsetWidth  
    ||  ev.offsetY > ev.offsetHeight) {

      ev.data.controller.chunkPositions.delete(currentDrag.data.chunk.id)

    } else {
      var x = ev.offsetX - currentDrag.offsetX
      var y = ev.offsetY - currentDrag.offsetY

      var r = Math.round(y/width)
      var c = Math.round(x/width)

      if (currentDrag.value[0] !== r || currentDrag.value[1] !== c){
        currentDrag.value = [r,c]
        ev.data.controller.chunkPositions.put(currentDrag.data.chunk.id, currentDrag.value)
      }
    }
  }

  if (~ev.dataTransfer.types.indexOf('filesrc')){
    ev.dataTransfer.dropEffect = 'link'
    ev.event.preventDefault()
  }
}

function drop(ev){
  var path = ev.dataTransfer.getData('filesrc')
  if (ev.data.setup && ev.data.setup.chunks){

    var lookup = ev.data.setup.chunks.controllerContextLookup()
    var base = getBaseName(path, '.json')
    var incr = 0
    var id = base

    while (lookup[id]){
      incr += 1
      id = base + ' ' + (incr + 1)
    }

    ev.data.setup.chunks.push({
      'node': 'external',
      'id': id,
      'src': path
    })
    
    var height = ev.offsetHeight / ev.data.controller.grid().shape[0]
    var width = ev.offsetWidth / ev.data.controller.grid().shape[1]
    var r = Math.floor(ev.offsetX/width)
    var c = Math.floor(ev.offsetX/width)
    ev.data.controller.chunkPositions.put(id, [r,c])
  }

}

function getElementMouseOffset(offsetX, offsetY, clientX, clientY){
  return [clientX - offsetX, clientY - offsetY]
}

function getOffset(start, end, size){
  var difference = (end - start) / size
  return Math.round(difference)
}

function percent(decimal){
  return (decimal * 100) + '%'
}

function color(rgb, a){
  if (!Array.isArray(rgb)){
    rgb = [100,100,100]
  }
  return 'rgba(' + rgb[0] +','+rgb[1]+','+rgb[2]+','+a+')'
}

function mixColor(a, b){
  if (!Array.isArray(a)){
    return b
  }
  return [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
    (a[2] + b[2]) / 2
  ]
}

function AttributeHook(value) {
  if (!(this instanceof AttributeHook)) {
    return new AttributeHook(value);
  }
  this.value = value;
}

AttributeHook.prototype.hook = function (node, prop, prev) {
  if (prev && prev.value === this.value) {
    return;
  }
  node.setAttributeNS(null, prop, this.value)
}