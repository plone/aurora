import { vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import config from '@plone/registry';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { filterControlPanels } from '../../config/controlpanels';
import { ControlPanelsList } from './ControlPanelsList';

vi.mock('@plone/icons/svg/chevron-right.svg?react', () => ({
  default: () => null,
}));

describe('ControlPanelsList', () => {
  const mockControlPanels = [
    {
      '@id': 'http://localhost:8080/Plone/@controlpanels/mail',
      href: '/controlpanel/mail',
      title: 'Mail',
      group: 'General',
    },
    {
      '@id': 'http://localhost:8080/Plone/@controlpanels/security',
      href: '/controlpanel/security',
      title: 'Security',
      group: 'Security',
    },
    {
      '@id': 'http://localhost:8080/Plone/@controlpanels/content',
      href: '/controlpanel/content',
      title: 'Content Settings',
      group: 'Content',
    },
  ];

  it('renders all control panels', () => {
    render(<ControlPanelsList controlpanels={mockControlPanels} />);

    mockControlPanels.forEach((panel) => {
      const link = screen.getByRole('link', { name: panel.title });
      expect(link).toBeInTheDocument();
    });
  });

  it('groups control panels correctly', () => {
    render(<ControlPanelsList controlpanels={mockControlPanels} />);

    const groups = ['General', 'Security', 'Content'];
    groups.forEach((group) => {
      expect(
        screen.getByRole('heading', { name: group, level: 2 }),
      ).toBeInTheDocument();
    });
  });

  it('renders links with correct hrefs', () => {
    render(<ControlPanelsList controlpanels={mockControlPanels} />);

    mockControlPanels.forEach((panel) => {
      const link = screen.getByRole('link', { name: panel.title });
      expect(link).toHaveAttribute('href', panel.href);
    });
  });

  it('hides the panels filtered out by the configuration', () => {
    config.settings.filterControlPanels = filterControlPanels;
    render(
      <ControlPanelsList
        controlpanels={[
          ...mockControlPanels,
          {
            '@id': 'http://localhost:8080/Plone/@controlpanels/markup',
            title: 'Markup',
            group: 'Content',
          },
        ]}
      />,
    );

    expect(
      screen.queryByRole('link', { name: 'Markup' }),
    ).not.toBeInTheDocument();
    delete (config.settings as Partial<typeof config.settings>)
      .filterControlPanels;
  });

  it('adds the panels of the add-ons to their group', () => {
    config.settings.controlpanels = [
      {
        '@id': '/my-addon',
        title: 'My add-on',
        group: 'Content',
      },
    ];
    render(<ControlPanelsList controlpanels={mockControlPanels} />);

    const content = screen
      .getByRole('heading', { name: 'Content', level: 2 })
      .closest('section')!;
    expect(
      within(content).getByRole('link', { name: 'My add-on' }),
    ).toHaveAttribute('href', '/controlpanel/my-addon');
    config.settings.controlpanels = [];
  });

  it('shows the icon of each panel, or the default one', () => {
    config.settings.controlPanelsIcons = {
      default: () => <svg data-testid="default-icon" />,
      mail: () => <svg data-testid="mail-icon" />,
    };
    render(<ControlPanelsList controlpanels={mockControlPanels} />);

    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('default-icon')).toHaveLength(2);
    config.settings.controlPanelsIcons = {};
  });

  it('keeps the order of the backend', () => {
    const panel = (id: string, title: string) => ({
      '@id': `http://localhost:8080/Plone/@controlpanels/${id}`,
      title,
      group: 'General',
    });
    render(
      <ControlPanelsList
        controlpanels={[panel('site', 'Site'), panel('mail', 'Mail')]}
      />,
    );

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(
      ['Site', 'Mail'],
    );
  });

  it('finds a control panel by its title', () => {
    render(<ControlPanelsList controlpanels={mockControlPanels} />);

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'secu' },
    });

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Security' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'General' }),
    ).not.toBeInTheDocument();
  });

  it('says when no control panel matches', () => {
    render(<ControlPanelsList controlpanels={mockControlPanels} />);

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'nothing like this' },
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('names each link by its title, and describes it', () => {
    const i18n = i18next.createInstance();
    i18n.init({
      lng: 'en',
      initAsync: false,
      resources: {
        en: {
          translation: {
            cmsui: { controlpanelDescriptions: { mail: 'Outgoing mail' } },
          },
        },
      },
    });
    render(
      <I18nextProvider i18n={i18n}>
        <ControlPanelsList
          controlpanels={[
            {
              '@id': 'http://localhost:8080/Plone/@controlpanels/mail',
              title: 'Mail',
              group: 'General',
            },
          ]}
        />
      </I18nextProvider>,
    );

    expect(
      screen.getByRole('link', { name: 'Mail' }),
    ).toHaveAccessibleDescription('Outgoing mail');
  });

  describe('with the fields of plone.restapi 10.2.0', () => {
    const i18n = i18next.createInstance();
    i18n.init({
      lng: 'de',
      initAsync: false,
      resources: {
        de: {
          translation: {
            cmsui: {
              controlpanelDescriptions: { mail: 'Ausgehende E-Mails' },
              controlpanelGroups: { 'plone-general': 'Allgemein' },
            },
          },
        },
      },
    });
    const mail = {
      '@id': 'http://localhost:8080/Plone/@controlpanels/mail',
      title: 'Mail',
      group: 'General',
    };

    it("uses the backend's description, or else the translated one", () => {
      render(
        <I18nextProvider i18n={i18n}>
          <ControlPanelsList
            controlpanels={[
              { ...mail, description: 'Mail server settings' },
              {
                ...mail,
                '@id': 'http://localhost:8080/Plone/@controlpanels/other',
                title: 'Other',
                description: '',
              },
            ]}
          />
        </I18nextProvider>,
      );

      expect(
        screen.getByRole('link', { name: 'Mail' }),
      ).toHaveAccessibleDescription('Mail server settings');
      expect(screen.getByRole('link', { name: 'Other' })).not.toHaveAttribute(
        'aria-describedby',
      );
    });

    it("uses the backend's icon, or else the one for the id", () => {
      config.settings.controlPanelsIcons = {
        default: () => <svg data-testid="default-icon" />,
        mail: () => <svg data-testid="mail-icon" />,
      };
      config.settings.controlPanelsIconNames = {
        'envelope-open': () => <svg data-testid="envelope-icon" />,
      };
      render(
        <ControlPanelsList
          controlpanels={[
            { ...mail, icon: 'envelope-open' },
            {
              ...mail,
              '@id': 'http://localhost:8080/Plone/@controlpanels/mail',
              title: 'Unknown icon',
              icon: 'not-mapped',
            },
          ]}
        />,
      );

      expect(screen.getByTestId('envelope-icon')).toBeInTheDocument();
      // An icon name without an SVG falls back to the icon for the id.
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      config.settings.controlPanelsIcons = {};
      config.settings.controlPanelsIconNames = {};
    });

    it('translates the group by its id, or else shows its title', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <ControlPanelsList
            controlpanels={[
              { ...mail, group_id: 'plone-general' },
              {
                '@id': 'http://localhost:8080/Plone/@controlpanels/my-addon',
                title: 'My add-on',
                group: 'My group',
                group_id: 'my-group',
              },
            ]}
          />
        </I18nextProvider>,
      );

      expect(
        screen.getByRole('heading', { name: 'Allgemein', level: 2 }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'My group', level: 2 }),
      ).toBeInTheDocument();
    });
  });
});
