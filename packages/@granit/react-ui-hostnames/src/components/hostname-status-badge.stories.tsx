import { CertificateStatus, HostnameStatus } from '@granit/hostnames';

import { CertStatusBadge, HostnameStatusBadge } from './hostname-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof HostnameStatusBadge> = {
  title: 'Hostnames/HostnameStatusBadge',
  component: HostnameStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: [
        HostnameStatus.Pending,
        HostnameStatus.Verifying,
        HostnameStatus.Active,
        HostnameStatus.Error,
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = { args: { status: HostnameStatus.Pending } };
export const Verifying: Story = { args: { status: HostnameStatus.Verifying } };
export const Active: Story = { args: { status: HostnameStatus.Active } };
export const Error: Story = { args: { status: HostnameStatus.Error } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <HostnameStatusBadge status={HostnameStatus.Pending} />
      <HostnameStatusBadge status={HostnameStatus.Verifying} />
      <HostnameStatusBadge status={HostnameStatus.Active} />
      <HostnameStatusBadge status={HostnameStatus.Error} />
    </div>
  ),
};

type CertMeta = Meta<typeof CertStatusBadge>;
type CertStory = StoryObj<CertMeta>;

export const CertificateUnprovisioned: CertStory = {
  render: () => <CertStatusBadge status={CertificateStatus.Unprovisioned} />,
};
export const CertificateProvisioning: CertStory = {
  render: () => <CertStatusBadge status={CertificateStatus.Provisioning} />,
};
export const CertificateSecured: CertStory = {
  render: () => <CertStatusBadge status={CertificateStatus.Secured} />,
};
export const CertificateError: CertStory = {
  render: () => <CertStatusBadge status={CertificateStatus.Error} />,
};

export const AllCertificate: CertStory = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CertStatusBadge status={CertificateStatus.Unprovisioned} />
      <CertStatusBadge status={CertificateStatus.Provisioning} />
      <CertStatusBadge status={CertificateStatus.Secured} />
      <CertStatusBadge status={CertificateStatus.Error} />
    </div>
  ),
};
