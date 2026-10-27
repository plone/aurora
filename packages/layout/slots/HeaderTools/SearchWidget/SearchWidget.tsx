import { Form, Input, Label, TextField } from 'react-aria-components';
import type { SlotComponentProps } from '../../SlotRenderer';
import { useTranslation } from 'react-i18next';
import { useRouteLoaderData } from 'react-router';
import type { RootLoader } from '@plone/aurora/app/root';
import { Button } from '@plone/components';
import Search from '@plone/icons/svg/search.svg?react';
import styles from './SearchWidget.module.css';
import clsx from 'clsx';

const SearchWidget = (props: SlotComponentProps) => {
  const { location } = props;

  const { t } = useTranslation();
  const site = useRouteLoaderData<RootLoader>('root')?.site;
  const languages: string[] = site?.features?.multilingual
    ? site['plone.available_languages'] || []
    : [];
  const firstSegment = location.pathname?.split('/')[1];
  const languageRoot = languages.includes(firstSegment)
    ? `/${firstSegment}`
    : null;

  return (
    <Form
      className={clsx(styles['searchwidget'], 'searchwidget')}
      action="/search"
      method="get"
    >
      <TextField name="search" type="text">
        <Label className="sr-only">
          {t('layout.slots.headertools.searchWidget.searchSite')}
        </Label>
        <Input
          name="SearchableText"
          placeholder={t('layout.slots.headertools.searchWidget.searchSite')}
        />
        {languageRoot && (
          <input type="hidden" name="path" value={languageRoot} />
        )}
      </TextField>
      <Button type="submit">
        <Search />
      </Button>
    </Form>
  );
};

export default SearchWidget;
