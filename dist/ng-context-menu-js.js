(function ContextMenu($angular, $document) {

    "use strict";

    /**
     * @module ngContextMenu
     * @author Fabyan Martin
     * @link https://github.com/fabyanmartin/ngContextMenu
     */
    var module = $angular.module('ngContextMenu', []);

    /**
     * @constant KEY_LEFT
     * @type {Number}
     */
    var KEY_LEFT = 1;

    /**
     * @module ngContextMenu
     * @service ContextMenu
     * @author Fabyan Martin
     * @link https://github.com/fabyanmartin/ngContextMenu
     */
    module.factory('contextMenu', ['$rootScope', function contextMenuService($rootScope) {

        /**
         * @method cancelAll
         * @return {void}
         */
        function cancelAll() {
            $rootScope.$broadcast('context-menu/close');
        }

        return { cancelAll: cancelAll, eventBound: false };

    }]);

    /**
     * @module ngContextMenu
     * @directive contextMenu
     * @author Fabyan Martin
     * @link https://github.com/fabyanmartin/ngContextMenu
     */
    module.directive('contextMenu', ['$timeout', '$interpolate', '$compile', 'contextMenu', '$templateRequest', '$sce', '$rootScope',

        function contextMenuDirective($timeout, $interpolate, $compile, contextMenu, $templateRequest, $sce, rootScope) {

            return {

                /**
                 * @property restrict
                 * @type {String}
                 */
                restrict: 'EA',

                /**
                 * @property scope
                 * @type {Boolean}
                 */
                scope: true,

                /**
                 * @property require
                 * @type {String}
                 */
                require: '?ngModel',

                /**
                 * @method link
                 * @param {Object} scope
                 * @param {angular.element} element
                 * @param {Object} attributes
                 * @param {Object} model
                 * @return {void}
                 */
                link: function link(scope, element, attributes, model) {

                    if (!contextMenu.eventBound) {

                        // Bind to the `document` if we haven't already.
                        $document.addEventListener('click', function click(event) {

                            if (event.which === KEY_LEFT) {
                                contextMenu.cancelAll();
                                scope.$apply();
                            }
                        });

                        contextMenu.eventBound = true;

                    }

                    /**
                     * @method closeMenu
                     * @return {void}
                     */
                    function closeMenu() {

                        if (scope.menu) {
                            scope.menu.remove();
                            scope.menu = null;
                            scope.position = null;
                        }

                    }

                    scope.$on('context-menu/close', closeMenu);
                    scope.$on('$destroy', closeMenu);

                    /**
                     * @method getModel
                     * @return {Object}
                     */
                    function getModel() {
                        return model ? $angular.extend(scope, model.$modelValue) : scope;
                    }

                    /**
                     * @method render
                     * @param {Object} event
                     * @param {String} [strategy="append"]
                     * @return {void}
                     */
                    function render(event, strategy) {

                        strategy = strategy || 'append';

                        if ('preventDefault' in event) {

                            contextMenu.cancelAll();
                            event.stopPropagation();
                            event.preventDefault();
                            scope.position = { x: event.clientX, y: event.clientY };

                        } else {

                            if (!scope.menu) {
                                return;
                            }

                        }

                        $templateRequest($sce.getTrustedResourceUrl(attributes.contextMenu)).then(function then(template) {
                            var compiled,menu;
                            if(model){
                                compiled = $compile(template)($angular.extend(getModel()));
                                menu = $angular.element(compiled);
                            }
                            else{
                                var elem = $angular.element(template);
                                if(elem && elem.length > 0){
                                    for (var i = 0; i < elem.length; i++) {
                                        if(elem[i].nodeType === 1){
                                            menu = $angular.element(elem[i]);
                                            break;
                                        }
                                    }
                                }
                            }


                            // Determine whether to append new, or replace an existing.
                            switch (strategy) {
                                case ('append'):
                                    angular.element($document.body).append(menu);
                                    break;
                                default:
                                    scope.menu.replaceWith(menu);
                                    break;
                            }

                            menu.css({
                                position: attributes.contextMenuPosition || 'fixed',
                                top: 0,
                                left: 0,
                                transform: $interpolate('translate({{x}}px, {{y}}px)')({
                                    x: scope.position.x,
                                    y: scope.position.y
                                })
                            });

                            scope.menu = menu;
                            scope.menu.bind('click', closeMenu);

                            //Broadcast event so that we can have the added element without searching the dom
                            rootScope.$broadcast('context-menu/created',menu)

                        });

                    }

                    if (model) {

                        var listener = function listener() {
                            return model.$modelValue;
                        };

                        // Listen for updates to the model...
                        scope.$watch(listener, function modelChanged() {
                            render({}, 'replaceWith');
                        }, true);

                    }

                    element.bind(attributes.contextEvent || 'contextmenu', render);

                }

            }

        }
    ]);

})(window.angular, window.document);