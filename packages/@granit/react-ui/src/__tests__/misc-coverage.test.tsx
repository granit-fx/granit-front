import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '../breadcrumb.js';
import { CardAction, Card, CardContent, CardFooter, CardHeader } from '../card.js';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '../dialog.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../select.js';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '../sheet.js';
import { Toaster } from '../sonner.js';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../table.js';

describe('Toaster', () => {
  beforeEach(() => {
    // sonner reads window.matchMedia for theme detection; jsdom doesn't provide it.
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent: () => false,
      }),
    });
  });

  it('renders the sonner notifications region with the default system theme', () => {
    render(<Toaster />);
    expect(document.querySelector('section[aria-label^="Notifications"]')).toBeInTheDocument();
  });

  it('accepts an explicit theme override', () => {
    render(<Toaster theme="dark" />);
    expect(document.querySelector('section[aria-label^="Notifications"]')).toBeInTheDocument();
  });
});

describe('Breadcrumb extras', () => {
  it('renders a default chevron separator and an ellipsis', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator data-testid="sep" />
          <BreadcrumbEllipsis />
        </BreadcrumbList>
      </Breadcrumb>
    );

    expect(screen.getByTestId('sep')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('renders a custom separator child when provided', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
        </BreadcrumbList>
      </Breadcrumb>
    );

    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('renders the link as a slotted child when asChild', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <a href="/dash">Dashboard</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );

    const link = screen.getByRole('link', { name: 'Dashboard' });
    expect(link).toHaveAttribute('data-slot', 'breadcrumb-link');
  });
});

describe('Card extras', () => {
  it('renders header with an action, content and footer slots', () => {
    render(
      <Card>
        <CardHeader>
          <CardAction data-testid="action">Act</CardAction>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter data-testid="footer">Foot</CardFooter>
      </Card>
    );

    expect(screen.getByTestId('action')).toHaveAttribute('data-slot', 'card-action');
    expect(screen.getByText('Body')).toHaveAttribute('data-slot', 'card-content');
    expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'card-footer');
  });
});

describe('Table extras', () => {
  it('renders a footer and caption alongside header/body', () => {
    render(
      <Table>
        <TableCaption>A list</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter data-testid="foot">
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(screen.getByText('A list')).toHaveAttribute('data-slot', 'table-caption');
    expect(screen.getByTestId('foot')).toHaveAttribute('data-slot', 'table-footer');
  });
});

describe('Dialog footer', () => {
  it('renders a built-in close button when showCloseButton is set', async () => {
    const user = userEvent.setup();
    function Controlled() {
      return (
        <Dialog defaultOpen>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Body</DialogDescription>
            <DialogFooter showCloseButton data-testid="footer">
              Footer
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    render(<Controlled />);
    // The content's own close button is disabled here, so the only "Close" button
    // is the footer one.
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toBeInTheDocument();

    await user.click(close);
    expect(screen.queryByText('Title')).not.toBeInTheDocument();
  });

  it('omits the footer close button by default', () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Body</DialogDescription>
          <DialogFooter>Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });
});

describe('Sheet sides', () => {
  it.each(['top', 'right', 'bottom', 'left'] as const)(
    'renders content for the %s side',
    (side) => {
      render(
        <Sheet open>
          <SheetContent side={side} data-testid="content">
            <SheetTitle>Sheet</SheetTitle>
            <SheetDescription>Desc</SheetDescription>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'sheet-content');
    }
  );

  it('omits the close button when showCloseButton is false', () => {
    render(
      <Sheet open>
        <SheetContent showCloseButton={false}>
          <SheetTitle>Sheet</SheetTitle>
          <SheetDescription>Desc</SheetDescription>
        </SheetContent>
      </Sheet>
    );

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });
});

describe('Select extras', () => {
  it('renders a small trigger plus grouped, labelled and separated items', async () => {
    const user = userEvent.setup();
    render(
      <Select>
        <SelectTrigger size="sm" aria-label="fruit" data-testid="trigger">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectSeparator />
            <SelectItem value="banana">Banana</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId('trigger')).toHaveAttribute('data-size', 'sm');

    await user.click(screen.getByRole('combobox', { name: 'fruit' }));
    expect(await screen.findByText('Fruits')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
  });
});
