import { vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SiteOverview from './SiteOverview';

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
    // Only the version number of Python, without its build details.
    expect(screen.getByText('3.13.15')).toBeInTheDocument();
    expect(screen.getByText('cmsui.siteOverview.upToDate')).toBeInTheDocument();
  });

  it('says when a Plone upgrade is available', () => {
    render(<SiteOverview system={{ ...system, upgrade: true }} />);

    expect(
      screen.getByText('cmsui.siteOverview.upgradeAvailable'),
    ).toBeInTheDocument();
  });

  it('copies the system information', async () => {
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
    expect(
      await screen.findByRole('button', { name: 'cmsui.siteOverview.copied' }),
    ).toBeInTheDocument();
  });

  it('says when the copy fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) },
      configurable: true,
    });
    render(<SiteOverview system={system} />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'cmsui.siteOverview.copySystemInfo',
      }),
    );

    expect(
      await screen.findByRole('button', {
        name: 'cmsui.siteOverview.copyFailed',
      }),
    ).toBeInTheDocument();
  });

  it('has no copy button without a clipboard', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    render(<SiteOverview system={system} />);

    expect(
      screen.queryByRole('button', {
        name: 'cmsui.siteOverview.copySystemInfo',
      }),
    ).not.toBeInTheDocument();
  });
});
