(function(){
  'use strict';

  document.addEventListener('contextmenu', function(e){
    e.preventDefault();
  }, {capture:true});

  document.addEventListener('keydown', function(e){
    const key = (e.key || '').toLowerCase();

    if (e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    if ((e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (e.ctrlKey && ['u', 's'].includes(key))) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, {capture:true});
})();
