(function() {
  var module = angular.module('ng.jsoneditor', []);

  module.directive('ngJsoneditor', JsonEditorDirective);

  JsonEditorDirective.$inject = [
    '$log',
    '$timeout'
  ];

  function JsonEditorDirective(
    $log,
    $timeout
  ) {
    void($log);

    return {
      restrict: 'EA',
      require: 'ngModel',
      scope: {
        options: '=',
        preferText: '=',
        expanded: '='
      },
      link: link
    };

    function link(scope, element, attrs, ngModel) {
      var globals = {};

      if (!angular.isDefined(window.JSONEditor)) {
        throw new Error("Please add the jsoneditor.js script first!");
      }

      scope.$watch(function() {
        return element.is(':visible');
      }, function(visible) {
        $log.debug('got visible.', visible);
        if (visible) {
          createJSONEditor(scope.options);
        } else {
          removeEditor();
        }
      });

      scope.$watch('options', onOptionsChanged, true);
      scope.$watch('expanded', onExpandedChanged);

      ngModel.$render = onModelChangedExternally;
      return;

      function getEditor() {
        return globals.editor;
      }

      function setEditor(editor) {
        globals.editor = editor;
      }

      function removeEditor() {
        delete globals.editor;
      }

      function createJSONEditor(options) {
        removeEditor();
        element.html('');
        $log.debug('[ng-jsoneditor] createJSONEditor(): options ==', options);
        if (options === undefined || options === null) {
          options = {};
        }
        options.onChange = onModelChangedInternally;
        options.onModeChange = onEditorModeChanged;
        var newEditor = new JSONEditor(element[0], options);
        setTextFromModelToJSONEditor(newEditor);
        setEditor(newEditor);
      }

      function onOptionsChanged(newOptions, oldOptions) {
        if (newOptions === undefined || newOptions === null) {
          newOptions = {};
        }
        var e = getEditor();
        if (e === undefined || e === null) {
          createJSONEditor(newOptions);
          e = getEditor();
        }

        for (var k in newOptions) {
          if (!newOptions.hasOwnProperty(k)) {
            continue;
          }

          if (newOptions[k] === oldOptions[k]) {
            continue;
          }

          var v = newOptions[k];

          if (k === 'mode') {
            e.setMode(v);
          } else if (k === 'name') {
            e.setName(v);
          } else {
            //other settings cannot be changed without re-creating the JsonEditor
            createJSONEditor(newOptions);
            return;
          }
        }
      }

      function setTextFromModelToJSONEditor(editor) {
        if (editor === undefined || editor === null) {
          return;
        }

        if ((scope.preferText === true) && !angular.isObject(ngModel.$viewValue)) {
          editor.setText(ngModel.$viewValue || '{}');
        } else {
          editor.set(ngModel.$viewValue || {});
        }
      }

      function onModelChangedExternally() {
        setTextFromModelToJSONEditor(getEditor());
      }

      function onModelChangedInternally() {
        var e = getEditor();
        if (e === undefined || e === null) {
          return;
        }

        var val;
        if (scope.preferText) {
          val = e.getText();
        } else {
          val = e.get();
        }
        ngModel.$setViewValue(val);

        // need to call $apply() because this function is not called in angular js's digest context
        scope.$apply();
      }

      function updateExpandCollapse() {
        var e = getEditor();
        if (e === undefined || e === null) {
          return;
        }

        if (scope.expanded && e.expandAll) {
          e.expandAll();
        } else if (!scope.expanded && e.collapseAll) {
          e.collapseAll();
        }
      }

      function onEditorModeChanged() {
        updateExpandCollapse();
      }

      function onExpandedChanged() {
        updateExpandCollapse();
      }
    }

  }

})();
