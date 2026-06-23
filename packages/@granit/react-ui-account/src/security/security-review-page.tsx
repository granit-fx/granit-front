import { isAxiosError } from '@granit/react-account';
import {
  IdentityProvider,
  useSessionReviewContext,
  useSubmitSessionReview,
} from '@granit/react-identity';
import { useTranslation } from '@granit/react-localization';
import { Alert, AlertDescription, Button, Spinner } from '@granit/react-ui';
import { AlertCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

/** Host layout wrapper (e.g. the public/anonymous shell). Defaults to a
 * passthrough so the package renders without a host layout. */
type LayoutComponent = React.ComponentType<{ readonly children: React.ReactNode }>;

const PassthroughLayout: LayoutComponent = ({ children }) => <>{children}</>;

/** A 400 from either endpoint means the token is invalid or has expired. */
function isExpiredTokenError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 400;
}

/** Centred status block: an icon badge, a title, and a message. */
function StatusBlock({
  icon,
  tone,
  title,
  message,
}: Readonly<{
  icon: React.ReactNode;
  tone: 'primary' | 'destructive';
  title: string;
  message: string;
}>) {
  const badge = tone === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10';
  return (
    <div className="text-center">
      <div
        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${badge}`}
      >
        {icon}
      </div>
      <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function BackToLoginLink() {
  const { t } = useTranslation();
  return (
    <div className="mt-4 text-center">
      <Link to={'/login'} className="text-sm text-muted-foreground hover:underline">
        {t('Auth.HeadlessLogin.BackToLogin', 'Back to sign in')}
      </Link>
    </div>
  );
}

/**
 * Renders the recorded review outcome — whether this visit committed the
 * decision (`justSubmitted`) or it was already on record from an earlier visit.
 */
function ReviewOutcome({
  decision,
  justSubmitted,
  Layout,
}: Readonly<{
  decision: 'Confirmed' | 'Denied';
  justSubmitted: boolean;
  Layout: LayoutComponent;
}>) {
  const { t } = useTranslation();
  const confirmed = decision === 'Confirmed';
  const icon = confirmed ? (
    <ShieldCheck className="h-6 w-6 text-primary" />
  ) : (
    <ShieldAlert className="h-6 w-6 text-destructive" />
  );

  if (justSubmitted) {
    return (
      <Layout>
        {confirmed ? (
          <StatusBlock
            tone="primary"
            icon={icon}
            title={t('Auth.SessionReview.ConfirmedTitle', 'Thanks')}
            message={t(
              'Auth.SessionReview.ConfirmedMessage',
              "Thanks — we've recognised this device."
            )}
          />
        ) : (
          <StatusBlock
            tone="destructive"
            icon={icon}
            title={t('Auth.SessionReview.DeniedTitle', 'Account secured')}
            message={t(
              'Auth.SessionReview.DeniedMessage',
              "We've signed you out everywhere and emailed you to reset your password."
            )}
          />
        )}
        <BackToLoginLink />
      </Layout>
    );
  }

  return (
    <Layout>
      <StatusBlock
        tone={confirmed ? 'primary' : 'destructive'}
        icon={icon}
        title={t('Auth.SessionReview.AlreadyReviewedTitle', 'Already reviewed')}
        message={
          confirmed
            ? t('Auth.SessionReview.RecordedConfirmed', 'You confirmed this was you.')
            : t('Auth.SessionReview.RecordedDenied', "You reported that this wasn't you.")
        }
      />
      <BackToLoginLink />
    </Layout>
  );
}

function SecurityReviewContent({ Layout }: { readonly Layout: LayoutComponent }) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const context = useSessionReviewContext(token);
  const submit = useSubmitSessionReview();

  // ── Invalid / expired link: no token at all, or a 400 from either call ──
  if (!token || isExpiredTokenError(context.error) || isExpiredTokenError(submit.error)) {
    return (
      <Layout>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('Auth.SessionReview.InvalidMessage', 'This link is invalid or has expired.')}
          </AlertDescription>
        </Alert>
        <BackToLoginLink />
      </Layout>
    );
  }

  // ── Unexpected (non-400) failure: network error, server error, … ──
  if (context.isError || submit.isError) {
    return (
      <Layout>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t(
              'Auth.SessionReview.ErrorMessage',
              "We couldn't load this sign-in review. Please try again later."
            )}
          </AlertDescription>
        </Alert>
        <BackToLoginLink />
      </Layout>
    );
  }

  // ── Loading the context ──
  if (!context.data) {
    return (
      <Layout>
        <div className="flex flex-col items-center py-4">
          <Spinner size="lg" className="mb-4" />
          <p className="text-sm text-muted-foreground">
            {t('Auth.SessionReview.Verifying', 'Checking this link…')}
          </p>
        </div>
      </Layout>
    );
  }

  const { decision, country } = context.data;

  // ── A decision is on record (committed this visit, or earlier) ──
  if (decision !== null) {
    return <ReviewOutcome decision={decision} justSubmitted={submit.isSuccess} Layout={Layout} />;
  }

  // ── Not yet reviewed — show the prompt and the two choices ──
  return (
    <Layout>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldAlert className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {t('Auth.SessionReview.Prompt', 'Was this you?')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {country
            ? `${t('Auth.SessionReview.SignInLocation', 'Recent sign-in location')}: ${country}`
            : t('Auth.SessionReview.NoLocation', 'We spotted a recent sign-in on your account.')}
        </p>
      </div>

      <div className="space-y-3">
        <Button
          className="w-full"
          disabled={submit.isPending}
          onClick={() => submit.mutate({ token, decision: 'Confirmed' })}
        >
          {submit.isPending
            ? t('Auth.SessionReview.Submitting', 'Saving…')
            : t('Auth.SessionReview.Yes', 'Yes, it was me')}
        </Button>
        <Button
          variant="destructive"
          className="w-full"
          disabled={submit.isPending}
          onClick={() => submit.mutate({ token, decision: 'Denied' })}
        >
          {submit.isPending
            ? t('Auth.SessionReview.Submitting', 'Saving…')
            : t('Auth.SessionReview.No', "No, it wasn't me")}
        </Button>
      </div>
    </Layout>
  );
}

interface SecurityReviewPageProps {
  /**
   * Host layout wrapping each render state — e.g. the app's public/anonymous
   * shell. Defaults to a passthrough so the page renders standalone. The
   * showcase host passes `layout={PublicLayout}`.
   */
  readonly layout?: LayoutComponent;
}

/**
 * "Was this you?" — the anonymous, token-protected sign-in review page reached
 * from a security-alert email CTA (`/account/security/review?token=…`). Renders
 * without an authenticated session: the token is the only credential. Backed by
 * the `/sessions/review` endpoints via `@granit/react-identity` (granit-dotnet
 * #2669). The Axios client is resolved from the host's `<GranitClientProvider>`.
 */
export function SecurityReviewPage({
  layout: Layout = PassthroughLayout,
}: SecurityReviewPageProps = {}) {
  return (
    <IdentityProvider config={{}}>
      <SecurityReviewContent Layout={Layout} />
    </IdentityProvider>
  );
}
