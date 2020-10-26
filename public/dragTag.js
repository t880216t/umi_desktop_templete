const drag = require('electron-drag');

// DRAG DROP FUNCTIONALITY

// declare the body the draggable area
var clear = drag('body');

// make a for loop when the drop event happens
document.addEventListener('drop', function (e) {
  // make sure that we total control
  e.preventDefault();
  e.stopPropagation();

  // for every dropped video make a <video> element with it's path a source
  for (let f of e.dataTransfer.files) {
    let input = '<video class="player" controls loop autoplay src="'+ f.path +'"></video>';
    document.getElementById('grid').insertAdjacentHTML('beforeend', input);
    console.log('File(s) you dragged here: ', f.path)
  }

  // clear the start text when a file is dropped
  document.getElementById('starttext').style.display='none';
});

// possibillity to add some nice css when hovering with the files above the screen
document.addEventListener('dragover', function (e) {
  e.preventDefault();
  e.stopPropagation();
});
