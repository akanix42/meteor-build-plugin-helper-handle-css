'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = monkeyPatchToHandleCssExtension;
/**
 * Monkey patch _registerSourceProcessor and SourceProcessorSet.merge so we can block the default CSS compiler
 */
function monkeyPatchToHandleCssExtension(Plugin, packageName, registerCompiler) {
  var registerSourceProcessor = Plugin._registerSourceProcessor;
  Plugin._registerSourceProcessor = function (options, factory, _ref) {
    var sourceProcessorSet = _ref.sourceProcessorSet,
        methodName = _ref.methodName,
        featurePackage = _ref.featurePackage;

    var buildPluginMerge = sourceProcessorSet.constructor.prototype.merge;
    sourceProcessorSet.constructor.prototype.merge = function (otherSet, options) {
      /* If a css plugin handler has already been added,
       * don't merge the meteor package, which only includes the 'css' package
       */
      if (otherSet._myPackageDisplayName !== 'meteor' || !('css' in this._byExtension)) {
        /* If we're using our CSS handler inside of a package, it's possible that Meteor's CSS build plugin got merged
         * before we could block it. In that case, unregister the Meteor CSS processor.
         */
        if ('css' in this._byExtension && 'css' in otherSet._byExtension) {
          var previouslyRegisteredSourceProcessor = this._byExtension.css[0];
          if (previouslyRegisteredSourceProcessor.isopack.displayName() === 'meteor' && otherSet._myPackageDisplayName === packageName) {
            this.allSourceProcessors.splice(this.allSourceProcessors.indexOf(previouslyRegisteredSourceProcessor), 1);
            delete this._byExtension.css;
          }
        }
        buildPluginMerge.call.apply(buildPluginMerge, [this].concat(Array.prototype.slice.call(arguments)));
      }
    };
    registerSourceProcessor(options, factory, { sourceProcessorSet: sourceProcessorSet, methodName: methodName, featurePackage: featurePackage });
  };

  registerCompiler();

  Plugin._registerSourceProcessor = registerSourceProcessor;
}
//# sourceMappingURL=handle-css.js.map
