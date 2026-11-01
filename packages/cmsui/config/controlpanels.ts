import type { ConfigType } from '@plone/registry';
import type { ComponentType, SVGProps } from 'react';
import type { Controlpanel } from '@plone/types';
import { controlPanelId } from '../helpers/controlpanels';
import CalendarSVG from '@plone/icons/svg/calendar.svg?react';
import CodeSVG from '@plone/icons/svg/code.svg?react';
import DiscussionSVG from '@plone/icons/svg/discussion.svg?react';
import EditSVG from '@plone/icons/svg/edit.svg?react';
import ImageSVG from '@plone/icons/svg/image.svg?react';
import LanguageSVG from '@plone/icons/svg/language.svg?react';
import MailSVG from '@plone/icons/svg/mail.svg?react';
import NavigationSVG from '@plone/icons/svg/navigation.svg?react';
import PageSVG from '@plone/icons/svg/page.svg?react';
import SearchSVG from '@plone/icons/svg/search.svg?react';
import SecuritySVG from '@plone/icons/svg/security.svg?react';
import SettingsSVG from '@plone/icons/svg/settings.svg?react';
import SocialSVG from '@plone/icons/svg/social.svg?react';
import UserSVG from '@plone/icons/svg/user.svg?react';
import VoltoSVG from '@plone/icons/svg/volto.svg?react';
import WorldSVG from '@plone/icons/svg/world.svg?react';

// One icon per control panel id; `default` is used for the others.
// Add-ons can add theirs to `config.settings.controlPanelsIcons`.
export const controlPanelsIcons: Record<
  string,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  default: SettingsSVG,
  'date-and-time': CalendarSVG,
  language: LanguageSVG,
  mail: MailSVG,
  navigation: NavigationSVG,
  site: WorldSVG,
  search: SearchSVG,
  socialmedia: SocialSVG,
  'volto-settings': VoltoSVG,
  'dexterity-types': PageSVG,
  'content-types': PageSVG,
  discussion: DiscussionSVG,
  editing: EditSVG,
  imaging: ImageSVG,
  markup: CodeSVG,
  usergroup: UserSVG,
  security: SecuritySVG,
};

// Panels the backend lists that Aurora does not show.
export const filterControlPanels = (controlpanels: Controlpanel[] = []) => {
  const HIDDEN_CONTROL_PANELS = ['markup', 'content-rules'];

  return controlpanels.filter(
    (controlpanel) =>
      !HIDDEN_CONTROL_PANELS.includes(controlPanelId(controlpanel)),
  );
};

export const unwantedControlPanelsFields = {
  language: ['display_flags', 'always_show_selector'],
  search: ['enable_livesearch'],
  site: [
    'display_publication_date_in_byline',
    'icon_visibility',
    'thumb_visibility',
    'no_thumbs_portlet',
    'no_thumbs_lists',
    'no_thumbs_summary',
    'no_thumbs_tables',
    'thumb_scale_portlet',
    'thumb_scale_listing',
    'thumb_scale_table',
    'thumb_scale_summary',
    'toolbar_position',
    'toolbar_logo',
    'default_page',
    'site_favicon',
    'site_favicon_mimetype',
    'exposeDCMetaTags',
    'enable_sitemap',
    'webstats_js',
  ],
  editing: ['available_editors', 'default_editor', 'ext_editor'],
  imaging: [
    'highpixeldensity_scales',
    'quality_2x',
    'quality_3x',
    'picture_variants',
    'image_captioning',
  ],
  navigation: [
    'generate_tabs',
    'navigation_depth',
    'nonfolderish_tabs',
    'sort_tabs_on',
    'sort_tabs_reversed',
    'sitemap_depth',
  ],
};

// Filters controlpanel.schema to only valid/relevant fields
export const filterControlPanelsSchema = (controlpanel: Controlpanel) => {
  const panelType = controlPanelId(controlpanel);

  // Creates modified version of properties object
  const newPropertiesObj = Object.fromEntries(
    Object.entries(controlpanel.schema?.properties ?? {}).filter(
      ([key, _val]) =>
        !(
          (panelType &&
            unwantedControlPanelsFields[
              panelType as keyof typeof unwantedControlPanelsFields
            ]) ||
          []
        ).includes(key),
    ),
  );
  // Filters controlpanel.schema.fieldsets.fields to only valid/relevant fields
  const filterFields = (fields: string[]) => {
    return fields.filter(
      (field) =>
        !(
          panelType && panelType in unwantedControlPanelsFields
            ? unwantedControlPanelsFields[
                panelType as keyof typeof unwantedControlPanelsFields
              ]
            : []
        ).includes(field),
    );
  };
  // Creates modified version of fieldsets array
  const newFieldsets = (controlpanel.schema?.fieldsets || []).map(
    (fieldset) => {
      return { ...fieldset, fields: filterFields(fieldset.fields) };
    },
  );

  // Returns clone of controlpanel.schema, with updated properties/fieldsets
  return {
    ...controlpanel.schema,
    properties: newPropertiesObj,
    fieldsets: newFieldsets,
    required: controlpanel.schema?.required || [],
  };
};

export default function install(config: ConfigType) {
  config.settings = config.settings ?? {};
  config.settings.filterControlPanelsSchema = filterControlPanelsSchema;
  config.settings.filterControlPanels = filterControlPanels;
  config.settings.controlPanelsIcons = {
    ...controlPanelsIcons,
    ...(config.settings.controlPanelsIcons as typeof controlPanelsIcons),
  };

  return config;
}
