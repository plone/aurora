import React from 'react';
import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tag, TagGroup } from './TagGroup';

it('Tag accepts a function as children', () => {
  render(
    <TagGroup label="Tags" onRemove={() => {}}>
      <Tag id="news">
        {({ allowsRemoving }) => (allowsRemoving ? 'News (removable)' : 'News')}
      </Tag>
    </TagGroup>,
  );

  expect(screen.getByText('News (removable)')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
});
