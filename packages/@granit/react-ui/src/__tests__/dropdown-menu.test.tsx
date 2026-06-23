import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../dropdown-menu.js';

function FullMenu() {
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuLabel inset>Inset label</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem inset>Inset item</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">
            Delete
            <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>Show toolbar</DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value="a">
          <DropdownMenuRadioItem value="a">Option A</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="b">Option B</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Nested</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger inset>Inset sub</DropdownMenuSubTrigger>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('renders an open menu with every item kind and its data attributes', () => {
    render(<FullMenu />);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Account')).toHaveAttribute('data-slot', 'dropdown-menu-label');

    const destructive = screen.getByRole('menuitem', { name: /Delete/ });
    expect(destructive).toHaveAttribute('data-variant', 'destructive');

    const insetItem = screen.getByRole('menuitem', { name: 'Inset item' });
    expect(insetItem).toHaveAttribute('data-inset', 'true');

    expect(screen.getByText('⌫')).toHaveAttribute('data-slot', 'dropdown-menu-shortcut');
    expect(screen.getByRole('menuitemcheckbox', { name: 'Show toolbar' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('menuitemradio', { name: 'Option A' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('menuitemradio', { name: 'Option B' })).toHaveAttribute(
      'aria-checked',
      'false'
    );

    const subTrigger = screen.getByText('More');
    expect(subTrigger).toHaveAttribute('data-slot', 'dropdown-menu-sub-trigger');
  });

  it('opens the menu from a closed trigger on click', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('menuitem', { name: 'Item' })).toBeInTheDocument();
  });

  it('invokes onSelect when an item is activated', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Click me</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByRole('menuitem', { name: 'Click me' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
