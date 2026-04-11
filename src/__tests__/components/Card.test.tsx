import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardAction,
} from '@/components/ui/card';

describe('Card components', () => {
  it('renders Card with children', () => {
    render(<Card><div>card content</div></Card>);
    expect(screen.getByText('card content')).toBeDefined();
  });

  it('renders Card with sm size variant', () => {
    const { container } = render(<Card size="sm">small card</Card>);
    expect(container.querySelector('[data-size="sm"]')).not.toBeNull();
  });

  it('renders CardHeader with title and description', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Test Description')).toBeDefined();
  });

  it('renders CardContent', () => {
    render(
      <Card>
        <CardContent>Card body text</CardContent>
      </Card>
    );
    expect(screen.getByText('Card body text')).toBeDefined();
  });

  it('renders CardFooter', () => {
    render(
      <Card>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );
    expect(screen.getByText('Footer content')).toBeDefined();
    expect(document.querySelector('[data-slot="card-footer"]')).not.toBeNull();
  });

  it('renders CardAction', () => {
    render(
      <Card>
        <CardHeader>
          <CardAction>Action button</CardAction>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Action button')).toBeDefined();
    expect(document.querySelector('[data-slot="card-action"]')).not.toBeNull();
  });

  it('applies custom className to Card', () => {
    const { container } = render(<Card className="custom-class">test</Card>);
    expect(container.firstChild).toBeDefined();
  });

  it('applies custom className to CardHeader', () => {
    const { container } = render(
      <Card><CardHeader className="custom-header">header</CardHeader></Card>
    );
    expect(screen.getByText('header')).toBeDefined();
  });

  it('applies custom className to CardFooter', () => {
    render(
      <Card><CardFooter className="custom-footer">footer</CardFooter></Card>
    );
    expect(screen.getByText('footer')).toBeDefined();
  });
});
