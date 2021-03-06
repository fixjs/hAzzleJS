// MutationObserver for hAzzle

(function($) {

  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
      lifecycles = function(node) {

    var nodes = $(node).find('[observer]').toArray();
    $(node).is('[observer]') && nodes.push(node);
    return nodes;
  };

  var observeAttribute = function(node, callback) {
    var attributeObserver = new MutationObserver(function(mutations) {
      $.each(mutations, function(index, mutation) {
        callback(mutation.attributeName);
      });
    });

    attributeObserver.observe(node, { subtree: false, attributes: true });

    return attributeObserver;
  };

  var observer = new MutationObserver(function(mutations) {

    $.each(mutations, function(index, mutation) {
      if (mutation.type === 'childList') {
        $.each(mutation.addedNodes, function(index, node) {
          $.each(lifecycles(node), function(index, node) {
            $.each(node.whenInsert || [], function(index, callback) {
              callback();
            });
          });
        });

        $.each(mutation.removedNodes, function(index, node) {
          $.each(lifecycles(node), function(index, node) {
            $.each(node.whenRemove || [], function(index, callback) {
              callback();
            });
          });
        });
      }
    });
  });

  $(function() {    
    observer.observe(document.body, { childList: true, subtree: true });
  });
  
  $.extend($.fn, {

   Observe: function(options) {
    var element = $(this).get(0);

    element.whenInsert = element.whenInsert || [];
    element.whenRemove = element.whenRemove || [];
    element.whenChange = element.whenChange || [];

    options = options || {};
    options.insert && element.whenInsert.push(options.insert);
    options.remove && element.whenRemove.push(options.remove);
    options.change && element.whenChange.push(observeAttribute(element, options.change));

    $(this).attr('observer', '');
  },

  unObserve: function() {

    var element = $(this).get(0);

    $.each(element.whenChange, function(index, attributeObserver) {
      attributeObserver.disconnect();
    });

    delete element.whenInsert;
    delete element.whenRemove;
    delete element.whenChange;
    
    $(this).removeAttr('observer');
  }
})
})(hAzzle);