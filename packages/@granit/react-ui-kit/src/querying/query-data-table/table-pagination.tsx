// ---------------------------------------------------------------------------
// TablePagination — pagination controls for QueryDataTable
// ---------------------------------------------------------------------------

import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';

export interface TablePaginationProps {
  /** Current page (1-based). */
  readonly page: number;
  /** Items per page. */
  readonly pageSize: number;
  /** Total number of items. */
  readonly totalCount: number;
  /** Callback when page changes. */
  readonly onPageChange: (page: number) => void;
  /** Callback when page size changes. */
  readonly onPageSizeChange: (pageSize: number) => void;
  /** Available page sizes. */
  readonly pageSizeOptions?: readonly number[];
  /** CSS class. */
  readonly className?: string;
}

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100] as const;

/**
 * Pagination controls with page navigation and page size selector.
 *
 * @example
 * ```tsx
 * <TablePagination
 *   page={params.page ?? 1}
 *   pageSize={params.pageSize ?? 20}
 *   totalCount={query.data?.totalCount ?? 0}
 *   onPageChange={setPage}
 *   onPageSizeChange={setPageSize}
 * />
 * ```
 */
export function TablePagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  className,
}: Readonly<TablePaginationProps>) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div
      data-slot="table-pagination"
      className={`flex items-center justify-between ${className ?? ''}`}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{t('Pagination.RowsPerPage')}</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-8 w-[80px]" aria-label={t('Pagination.RowsPerPage')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>{t('Pagination.PageOf', { page, total: totalPages })}</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={isFirstPage}
          aria-label={t('Pagination.FirstPage')}
        >
          <ChevronsLeftIcon className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage}
          aria-label={t('Pagination.PreviousPage')}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage}
          aria-label={t('Pagination.NextPage')}
        >
          <ChevronRightIcon className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={isLastPage}
          aria-label={t('Pagination.LastPage')}
        >
          <ChevronsRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
