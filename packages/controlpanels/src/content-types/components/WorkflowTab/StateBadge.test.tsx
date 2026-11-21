import { render, screen } from '@testing-library/react';
import { ContentTypesDriverProvider } from '../../driver';
import { createMockDriver } from '../../mock/createMockDriver';
import type { WorkflowState } from '../../types';
import { StateBadge } from './StateBadge';

const published: WorkflowState = {
  id: 'published',
  title: 'Published',
  visibility: 'anyone',
};

describe('StateBadge', () => {
  it('shows the default color of a core state', () => {
    render(
      <ContentTypesDriverProvider driver={createMockDriver()}>
        <StateBadge state={published} />
      </ContentTypesDriverProvider>,
    );
    expect(screen.getByText('Published')).toHaveAttribute(
      'data-color',
      'green',
    );
  });

  it('shows the color the site configures', () => {
    render(
      <ContentTypesDriverProvider
        driver={createMockDriver()}
        stateColors={{ published: 'blue' }}
      >
        <StateBadge state={published} />
      </ContentTypesDriverProvider>,
    );
    expect(screen.getByText('Published')).toHaveAttribute('data-color', 'blue');
  });
});
