import { vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SiteOverview from './SiteOverview';

vi.mock('@plone/icons/svg/checkbox.svg?react', () => ({
  default: () => {},
}));

vi.mock('@plone/icons/svg/arrow-right.svg?react', () => ({
  default: (props: object) => <svg {...props} />,
}));

const appInfo = vi.hoisted(() => ({
  name: '@plone/aurora-dev',
  version: '1.0.0-alpha.23',
  aurora: '1.0.0-alpha.23' as string | undefined,
  addons: [
    { name: '@some/addon', version: '1.3.5' },
    { name: '@some/other-addon', version: '2.2.5' },
  ],
}));

vi.mock('@plone/registry/app-info', () => ({ default: appInfo }));

vi.mock('@plone/icons/svg/checkbox.svg?react', () => ({
  default: () => {},
}));

const system = {
  '@id': 'http://localhost:8080/Plone/@system',
  cmf_version: '3.8',
  debug_mode: 'No',
  pil_version: '12.3.0 (Pillow)',
  plone_gs_metadata_version_file_system: '6205',
  plone_gs_metadata_version_installed: '6205',
  plone_restapi_version: '10.0.4',
  plone_version: '6.2.2',
  python_version: '3.13.15 (main, Aug 31 2026, 23:46:42) [GCC 12.2.0]',
  upgrade: false,
  zope_version: '6.2',
};

describe('SiteOverview', () => {
  it('shows the site and the versions it runs on', () => {
    render(
      <SiteOverview
        system={system}
        site={{ 'plone.site_title': 'My site', 'plone.portal_timezone': 'UTC' }}
        siteUrl="https://example.com"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'My site', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'example.com' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
    expect(screen.getByText('6.2.2')).toBeInTheDocument();
    expect(screen.getByText('10.0.4')).toBeInTheDocument();
    // Aurora's version comes from `@plone/registry/app-info`.
    expect(screen.getByText('Plone Aurora')).toBeInTheDocument();
    expect(screen.getByText('1.0.0-alpha.23')).toBeInTheDocument();
    // The app that develops Aurora isn't listed on its own.
    expect(screen.queryByText('@plone/aurora-dev')).not.toBeInTheDocument();
    // Only the version number of Python, without its build details.
    expect(screen.getByText('3.13.15')).toBeInTheDocument();
    expect(screen.getByText('cmsui.siteOverview.upToDate')).toBeInTheDocument();

    // The add-ons section is always shown because we always have add-ons.
    expect(screen.getByText('cmsui.siteOverview.addons')).toBeInTheDocument();

    expect(screen.getByText('@some/addon')).toBeInTheDocument();
    expect(screen.getByText('1.3.5')).toBeInTheDocument();
    expect(screen.getByText('@some/other-addon')).toBeInTheDocument();
    expect(screen.getByText('2.2.5')).toBeInTheDocument();
  });

  it('says when a Plone upgrade is available', () => {
    render(<SiteOverview system={{ ...system, upgrade: true }} />);

    expect(screen.getByText('cmsui.siteOverview.upgrade')).toBeInTheDocument();
    // The upgrade runs in the app's own upgrade control panel.
    expect(
      screen.getByRole('link', { name: 'cmsui.siteOverview.runUpgrade' }),
    ).toHaveAttribute('href', '/@@controlpanel/plone-upgrade');
  });

  it('copies the system information with addons', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    render(<SiteOverview system={system} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'cmsui.siteOverview.copySystemInfo' }),
    );

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('Python: 3.13.15 (main'),
    );
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('Add-ons:\n\n@some/addon: 1.3.5'),
    );
    expect(
      await screen.findByRole('button', { name: 'cmsui.siteOverview.copied' }),
    ).toBeInTheDocument();
  });

  it('copies the system information with no addons', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    render(<SiteOverview system={system} addons={[]} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'cmsui.siteOverview.copySystemInfo' }),
    );

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('Python: 3.13.15 (main'),
    );
    expect(writeText).toHaveBeenCalledWith(
      expect.not.stringContaining('Add-ons:'),
    );
    expect(
      await screen.findByRole('button', { name: 'cmsui.siteOverview.copied' }),
    ).toBeInTheDocument();
  });

  it("shows a project's app next to the Aurora version it uses", () => {
    const original = { ...appInfo };
    Object.assign(appInfo, {
      name: 'my-project',
      version: '2.0.0',
      aurora: '1.0.0-alpha.28',
    });

    render(
      <SiteOverview
        system={system}
        site={{ 'plone.site_title': 'My site', 'plone.portal_timezone': 'UTC' }}
        siteUrl="https://example.com"
      />,
    );

    expect(screen.getByText('Plone Aurora')).toBeInTheDocument();
    expect(screen.getByText('1.0.0-alpha.28')).toBeInTheDocument();
    expect(screen.getByText('my-project')).toBeInTheDocument();
    expect(screen.getByText('2.0.0')).toBeInTheDocument();

    Object.assign(appInfo, original);
  });
});
