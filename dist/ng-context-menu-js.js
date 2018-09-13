(function ContextMenu($angular, $document) {

    "use strict";

    /**
     * @module ngContextMenu
     * @author Fabyan Martin
     * @author Adam Timberlake
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
     * @author Adam Timberlake
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
     * @author Adam Timberlake
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
                     var overrideLeftClick = element[0].hasAttribute('context-menu-include-left-click');

                    if (!contextMenu.eventBound) {

                        // Bind to the `document` if we haven't already.
                        $document.addEventListener('click', function click(event) {

                            if (event.which === KEY_LEFT && !overrideLeftClick) {
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

                            var menu = $angular.element(template);
                            //Apply css before we compile the element
                            menu.css({
                                position: attributes.contextMenuPosition || 'fixed',
                                top: 0,
                                left: 0,
                                transform: $interpolate('translate({{x}}px, {{y}}px)')({
                                    x: scope.position.x,
                                    y: scope.position.y
                                })
                            });


                            //Compile the menu
                            var compiled = $compile(menu)($angular.extend(getModel()));
                            var parent = $angular.element('<div></div>');
                            parent.html(compiled);


                            // Determine whether to append new, or replace an existing.
                            switch (strategy) {
                                case ('append'):
                                    angular.element($document.body).append(parent);
                                    break;
                                default:
                                    scope.menu.replaceWith(parent);
                                    break;
                            }


                            scope.menu = parent;
                            if(!overrideLeftClick){
                                parent.bind('click', closeMenu);
                            }

                            //Broadcast event so that we can have the added element without searching the dom
                            rootScope.$broadcast('context-menu/created',parent)

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
                    if(overrideLeftClick){
                        element.bind('click', render);
                    }

                }

            }

        }
    ]);

})(window.angular, window.document);
