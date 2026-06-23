import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '../alert-dialog.js';
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '../avatar.js';
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '../command.js';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../popover.js';

describe('Avatar', () => {
  it('defaults to size "default" and exposes the data-size attribute', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback>JF</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-size', 'default');
  });

  it.each(['sm', 'lg'] as const)('honours the %s size variant', (size) => {
    render(
      <Avatar data-testid="avatar" size={size}>
        <AvatarFallback>JF</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-size', size);
  });

  it('renders image, badge, group and group-count slots', () => {
    render(
      <AvatarGroup data-testid="group">
        <Avatar>
          <AvatarImage src="https://example.com/a.png" alt="A" />
          <AvatarFallback>A</AvatarFallback>
          <AvatarBadge data-testid="badge" />
        </Avatar>
        <AvatarGroupCount data-testid="count">+3</AvatarGroupCount>
      </AvatarGroup>
    );

    expect(screen.getByTestId('group')).toHaveAttribute('data-slot', 'avatar-group');
    expect(screen.getByTestId('badge')).toHaveAttribute('data-slot', 'avatar-badge');
    expect(screen.getByTestId('count')).toHaveAttribute('data-slot', 'avatar-group-count');
  });
});

describe('Popover', () => {
  it('renders header/title/description content when open', () => {
    render(
      <Popover open>
        <PopoverAnchor />
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Title</PopoverTitle>
            <PopoverDescription>Description</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    );

    expect(screen.getByText('Title')).toHaveAttribute('data-slot', 'popover-title');
    expect(screen.getByText('Description')).toHaveAttribute('data-slot', 'popover-description');
  });

  it('opens its content on trigger click', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>
    );

    expect(screen.queryByText('Body')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByText('Body')).toBeInTheDocument();
  });
});

describe('Command', () => {
  it('renders groups, separators and shortcuts and filters on input', async () => {
    const user = userEvent.setup();
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandGroup heading="Fruits">
            <CommandItem>
              Apple
              <CommandShortcut>⌘A</CommandShortcut>
            </CommandItem>
            <CommandItem>Banana</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Veggies">
            <CommandItem>Carrot</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );

    expect(screen.getByText('Fruits')).toBeInTheDocument();
    expect(screen.getByText('⌘A')).toHaveAttribute('data-slot', 'command-shortcut');

    await user.type(screen.getByPlaceholderText('Search'), 'carr');
    expect(screen.getByText('Carrot')).toBeInTheDocument();
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  });

  it('CommandDialog renders its title/description and content when open', () => {
    render(
      <CommandDialog open title="Palette" description="Type a command">
        <CommandList>
          <CommandItem>Run</CommandItem>
        </CommandList>
      </CommandDialog>
    );

    expect(screen.getByText('Palette')).toBeInTheDocument();
    expect(screen.getByText('Type a command')).toBeInTheDocument();
    expect(screen.getByText('Run')).toBeInTheDocument();
  });

  it('CommandDialog can hide the close button', () => {
    render(
      <CommandDialog open showCloseButton={false}>
        <CommandList>
          <CommandItem>Run</CommandItem>
        </CommandList>
      </CommandDialog>
    );

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });
});

describe('AlertDialog', () => {
  it('renders content with media, footer and styled action/cancel buttons', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia data-testid="media" />
            <AlertDialogTitle>Confirm</AlertDialogTitle>
            <AlertDialogDescription>Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByTestId('media')).toHaveAttribute('data-slot', 'alert-dialog-media');
    expect(screen.getByText('Cancel')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByText('Delete')).toHaveAttribute('data-variant', 'destructive');
  });

  it('applies the small content size variant', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent size="sm" data-testid="content">
          <AlertDialogTitle>Title</AlertDialogTitle>
          <AlertDialogDescription>Body</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    );

    expect(screen.getByTestId('content')).toHaveAttribute('data-size', 'sm');
  });
});
