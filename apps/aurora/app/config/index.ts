/**
 * This is the client side config entry point
 */
import config from '@plone/registry';
import applyAddonConfiguration from '@plone/registry/addons-loader';

export default function install() {
  config.settings.defaultLanguage = 'en';
  config.settings.supportedLanguages = ['en'];

  applyAddonConfiguration(config);

  return config;
}
