import React from 'react';
import { styled } from '@compiled/css-in-js';

export const List = ({ children, as: Tag }: { children: React.ReactNode; as: 'ul' | 'ol' }) => (
  <Tag>{children}</Tag>
);

export const ListItem = styled.li``;
