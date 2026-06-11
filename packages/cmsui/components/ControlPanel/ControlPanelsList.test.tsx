import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ControlPanelsList } from './ControlPanelsList';

// The list renders a decorative icon per control panel. Under vitest the
// `?react` SVG imports resolve to a data-URI string rather than a component,
// so they must be stubbed before the component is rendered (same approach as
// RecurrenceWidget.test.tsx). Factories are inlined because `vi.mock` is
// hoisted above the imports.
vi.mock('@plone/components/icons/calendar.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/language.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/mail.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/navigation.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/world.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/search.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/social.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/image.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/code.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/discussion.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/edit.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/undo.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/user.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/link.svg?react', () => ({
  default: () => <svg />,
}));
vi.mock('@plone/components/icons/settings.svg?react', () => ({
  default: () => <svg />,
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
});
