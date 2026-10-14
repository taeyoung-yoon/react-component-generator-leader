import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentCard } from './ComponentCard';
import type { GeneratedComponent } from '../types';

vi.mock('./LivePreview', () => ({
  LivePreview: ({ code }: { code: string }) => <div data-testid="live-preview">{code}</div>,
}));

const component: GeneratedComponent = {
  id: '1',
  prompt: '버튼',
  code: 'const A = () => null;',
  createdAt: new Date('2026-01-01T09:00:00'),
};

const renderCard = (props: Partial<React.ComponentProps<typeof ComponentCard>> = {}) =>
  render(
    <ComponentCard
      component={component}
      onRemove={() => {}}
      onRegenerate={() => {}}
      isLoading={false}
      {...props}
    />,
  );

describe('ComponentCard 스트리밍', () => {
  it('스트리밍 중에는 코드 탭이 활성화되고 생성 중인 코드를 보여준다', () => {
    renderCard({ isStreaming: true });

    expect(screen.getByRole('button', { name: '코드' })).toHaveClass('tab--active');
    expect(screen.getByText('const A = () => null;')).toBeInTheDocument();
    expect(screen.queryByTestId('live-preview')).not.toBeInTheDocument();
  });

  it('스트리밍 중에는 미리보기 탭을 누를 수 없다', () => {
    renderCard({ isStreaming: true });

    expect(screen.getByRole('button', { name: '미리보기' })).toBeDisabled();
  });

  it('스트리밍이 끝나면 미리보기 탭으로 자동 전환된다', () => {
    const { rerender } = renderCard({ isStreaming: true });

    rerender(
      <ComponentCard
        component={component}
        onRemove={() => {}}
        onRegenerate={() => {}}
        isLoading={false}
        isStreaming={false}
      />,
    );

    expect(screen.getByRole('button', { name: '미리보기' })).toHaveClass('tab--active');
    expect(screen.getByTestId('live-preview')).toBeInTheDocument();
  });

  it('스트리밍이 아닌 카드는 기존처럼 미리보기가 기본이고 탭을 바꿀 수 있다', async () => {
    renderCard();

    expect(screen.getByTestId('live-preview')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '코드' }));
    expect(screen.queryByTestId('live-preview')).not.toBeInTheDocument();
  });
});
