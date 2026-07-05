import { iotConstraints } from '@granit/iot';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import type { DeviceResponse } from '@granit/iot';
import type { Resolver } from 'react-hook-form';

function capitalize(value: string): string {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);
}

export interface DeviceFormValues {
  serialNumber: string;
  hardwareModel: string;
  firmwareVersion: string;
  label: string;
}

interface DeviceFormBaseProps {
  onCancel: () => void;
  onSubmit: (data: DeviceFormValues) => Promise<void>;
  isPending?: boolean;
}

interface ProvisionDeviceFormProps extends DeviceFormBaseProps {
  mode: 'provision';
  defaultValues?: never;
}

interface EditDeviceFormProps extends DeviceFormBaseProps {
  mode: 'edit';
  defaultValues: DeviceResponse;
}

type DeviceFormProps = ProvisionDeviceFormProps | EditDeviceFormProps;

export function DeviceForm(props: Readonly<DeviceFormProps>) {
  const { mode, onCancel, onSubmit, isPending = false } = props;
  const { t } = useTranslation();
  const isEdit = mode === 'edit';

  // Validation is spec-driven: constraints are generated from
  // contracts/openapi/iot.json. The resolver only validates registered fields, so
  // on edit the DeviceUpdateRequest spec applies (firmwareVersion / label only) —
  // serialNumber and hardwareModel are read-only and pass through unchecked.
  // `Validation:Builtin:*` messages are owned by the host `Granit.Validation`.
  const formResolver = useMemo(
    () =>
      createConstraintsResolver(
        isEdit ? iotConstraints.DeviceUpdateRequest : iotConstraints.DeviceProvisionRequest,
        t,
        { labelResolver: (field) => t(`IoT.Fields.${capitalize(field)}`, field) }
      ) as unknown as Resolver<DeviceFormValues>,
    [isEdit, t]
  );

  const form = useForm<DeviceFormValues>({
    resolver: formResolver,
    defaultValues: {
      serialNumber: props.defaultValues?.serialNumber ?? '',
      hardwareModel: props.defaultValues?.hardwareModel ?? '',
      firmwareVersion: props.defaultValues?.firmwareVersion ?? '',
      label: props.defaultValues?.label ?? '',
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Form {...form}>
      <form data-slot="device-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isEdit ? t('IoT.Form.EditTitle') : t('IoT.Form.ProvisionTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('IoT.Form.SerialNumber')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isEdit}
                        placeholder={t('IoT.Form.SerialNumberPlaceholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hardwareModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('IoT.Form.Model')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isEdit}
                        placeholder={t('IoT.Form.ModelPlaceholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firmwareVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('IoT.Form.Firmware')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('IoT.Form.FirmwarePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('IoT.Form.Label')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('IoT.Form.LabelPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? '...' : t('Common.Save')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Common.Cancel')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
