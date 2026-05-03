import React from 'react';
import { Link } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Sprout,
  ShieldAlert,
  Sparkles,
  Calendar,
  MapPin,
  Navigation,
  Clock3,
  ChevronRight,
} from 'lucide-react';
import type { Farm, HeatmapData } from '@/types/farm';
import { formatArea, formatDate } from '@/utils';

interface FarmOverviewPanelProps {
  farm: Farm;
  heatmapData?: HeatmapData | null;
  canEdit: boolean;
  onDelete: () => void;
  onOpenAnalysis: () => void;
  onOpenTrends: () => void;
  onViewOnMap: () => void;
}

const HEALTH_STYLES: Record<string, string> = {
  Excellent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Good: 'bg-lime-100 text-lime-800 border-lime-200',
  Moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  Poor: 'bg-orange-100 text-orange-800 border-orange-200',
  Critical: 'bg-red-100 text-red-800 border-red-200',
};

export const FarmOverviewPanel: React.FC<FarmOverviewPanelProps> = ({
  farm,
  heatmapData,
  canEdit,
  onDelete,
  onOpenAnalysis,
  onOpenTrends,
  onViewOnMap,
}) => {
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const DESCRIPTION_PREVIEW_CHARS = 28;

  const ai = heatmapData?.ai_analysis;
  const location = heatmapData?.location;
  const pixelCounts = heatmapData?.pixel_counts;

  const riskScore = Math.max(0, Math.min(100, Number(ai?.risk_score ?? 0)));
  const riskColor =
    riskScore <= 30
      ? 'bg-emerald-500'
      : riskScore <= 60
        ? 'bg-amber-500'
        : 'bg-red-500';
  const riskLabel =
    riskScore <= 30 ? 'Low' : riskScore <= 60 ? 'Medium' : 'High';

  const totalPixels =
    (pixelCounts?.valid && pixelCounts.valid > 0
      ? pixelCounts.valid
      : (pixelCounts?.red ?? 0) +
        (pixelCounts?.yellow ?? 0) +
        (pixelCounts?.green ?? 0)) || 0;

  const greenPct =
    totalPixels > 0 ? ((pixelCounts?.green ?? 0) / totalPixels) * 100 : 0;
  const yellowPct =
    totalPixels > 0 ? ((pixelCounts?.yellow ?? 0) / totalPixels) * 100 : 0;
  const redPct =
    totalPixels > 0 ? ((pixelCounts?.red ?? 0) / totalPixels) * 100 : 0;

  const immediateActions = (
    ai?.immediate_actions ??
    heatmapData?.suggestions?.immediate_actions ??
    []
  ).slice(0, 2);
  const topIssue = ai?.issues?.[0];
  const priority = ai?.priority ?? 'Medium';
  const priorityDotClass =
    priority === 'High'
      ? 'bg-red-500'
      : priority === 'Low'
        ? 'bg-emerald-500'
        : 'bg-amber-500';

  const descriptionPreview = farm.description
    ? farm.description.length > DESCRIPTION_PREVIEW_CHARS
      ? `${farm.description.slice(0, DESCRIPTION_PREVIEW_CHARS)}...`
      : farm.description
    : '';

  const plantingDate = new Date(farm.plantingDate);
  const harvestDate = new Date(farm.harvestDate);
  const now = new Date();
  const totalCycleDays = Math.max(
    1,
    Math.ceil(
      (harvestDate.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );
  const daysSincePlanting = Math.max(
    0,
    Math.ceil((now.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysRemaining = Math.max(
    0,
    Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
  const cycleProgress = Math.max(
    0,
    Math.min(100, (daysSincePlanting / totalCycleDays) * 100)
  );

  let cropStage = 'Planned';
  if (now > harvestDate) {
    cropStage = 'Completed';
  } else if (now >= plantingDate) {
    cropStage = cycleProgress >= 90 ? 'Harvest Window' : 'Growing';
  }
  const isCycleCompleted = cropStage === 'Completed' || daysRemaining === 0;

  const boundaryPoints =
    farm.coordinates?.filter(point => point.length >= 2).length ?? 0;
  const summaryText =
    ai?.summary?.trim() ||
    heatmapData?.suggestions?.overall_assessment?.trim() ||
    '';
  const truncatedSummary =
    summaryText.length > 150 ? `${summaryText.slice(0, 150)}...` : summaryText;

  return (
    <div className='space-y-3'>
      <div className='relative overflow-hidden rounded-xl border border-emerald-200 bg-[linear-gradient(130deg,#064e3b_0%,#065f46_35%,#10b981_100%)] p-3.5 text-white shadow-sm'>
        <div className='absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/20 blur-xl' />
        <div className='absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-emerald-300/30 blur-xl' />
        <div className='relative flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <div className='flex items-center gap-2.5'>
              <div className='h-10 w-10 p-2 rounded-xl border border-white/35 bg-white/15 backdrop-blur flex items-center justify-center shadow-sm ml-0.5'>
                <Sprout className='h-5 w-5 text-emerald-50' />
              </div>
              <h2 className='truncate text-base font-bold text-white'>
                {farm.name}
              </h2>
            </div>
            <div className='mt-2 flex flex-wrap items-center gap-1.5'>
              <span className='inline-flex items-center rounded-full border border-white/40 bg-white/20 px-2.5 py-1 text-xs font-semibold text-white'>
                {farm.crop}
              </span>
              {location?.district && (
                <span className='inline-flex items-center rounded-full border border-white/35 bg-white/15 px-2.5 py-1 text-xs font-medium text-emerald-50'>
                  <MapPin className='mr-1 h-3 w-3' />
                  {location.district}
                </span>
              )}
            </div>
            {farm.description && (
              <div className='mt-1.5 text-[11px] leading-4 text-emerald-50'>
                <p>
                  {descriptionExpanded ? farm.description : descriptionPreview}
                </p>
                {farm.description.length > DESCRIPTION_PREVIEW_CHARS && (
                  <button
                    type='button'
                    onClick={() => setDescriptionExpanded(prev => !prev)}
                    className='mt-1 inline-flex items-center text-[11px] font-semibold text-white hover:text-emerald-100'
                  >
                    {descriptionExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className='flex flex-col items-end gap-1.5 min-w-[128px]'>
            {canEdit && (
              <div className='mb-0.5 flex items-center gap-1'>
                <Link
                  to={`/farm/${farm.id}/edit`}
                  className='inline-flex items-center rounded-md border border-white/40 bg-white/15 px-2 py-1 text-[10px] font-semibold text-white hover:bg-white/25'
                >
                  <Edit className='mr-1 h-3 w-3' />
                  Edit
                </Link>
                <button
                  type='button'
                  onClick={onDelete}
                  className='inline-flex items-center rounded-md border border-red-200/70 bg-white/15 px-2 py-1 text-[10px] font-semibold text-red-100 hover:bg-red-400/20'
                >
                  <Trash2 className='mr-1 h-3 w-3' />
                  Delete
                </button>
              </div>
            )}
            {/* <p className='w-full whitespace-nowrap text-[10px] text-right text-neutral-500'>
              Updated {formatRelativeTime(farm.updatedAt)}
            </p> */}
            <div className='w-full mt-0.5 space-y-1 text-[10px]'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-emerald-100'>Overall health</span>
                <span
                  className={`inline-flex items-center whitespace-nowrap rounded-full border bg-white/90 px-2 py-0.5 text-[10px] font-semibold ${
                    HEALTH_STYLES[ai?.overall_health ?? 'Moderate'] ??
                    HEALTH_STYLES.Moderate
                  }`}
                >
                  {ai?.overall_health ?? 'Moderate'}
                </span>
              </div>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-emerald-100'>Confidence</span>
                <span className='font-semibold text-white'>
                  {ai?.confidence ?? 'N/A'}
                </span>
              </div>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-emerald-100'>Priority</span>
                <span className='inline-flex items-center gap-1 font-semibold text-white'>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${priorityDotClass}`}
                  />
                  {priority}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='w-full rounded-xl border border-emerald-200 bg-[linear-gradient(145deg,#f0fdf4_0%,#ffffff_55%,#ecfeff_100%)] p-3.5 shadow-sm transition-transform duration-300 hover:-translate-y-0.5'>
        <div className='mb-2.5 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <ShieldAlert className='h-4 w-4 text-emerald-700' />
            <h3 className='text-sm font-semibold text-neutral-900'>
              Field Health Overview
            </h3>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${riskColor}`}
          >
            <span>Risk</span>
            <span>{riskLabel}</span>
          </span>
        </div>
        <div>
          <div className='mb-1 flex items-center justify-between text-[11px] text-neutral-600'>
            <span>Risk Score</span>
            <span className='font-semibold text-neutral-800'>
              {Math.round(riskScore)}/100
            </span>
          </div>
          <div className='h-2 overflow-hidden rounded-full bg-neutral-100'>
            <div
              className={`h-full ${riskColor} transition-all duration-500`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
          <p className='mt-1.5 text-[11px] leading-4 text-neutral-600'>
            {riskLabel === 'High'
              ? 'High stress pockets detected. Action needed soon.'
              : riskLabel === 'Medium'
                ? 'Moderate stress pockets present. Keep monitoring.'
                : 'Field condition is stable.'}
          </p>
          <div className='mt-3 h-2 overflow-hidden rounded-full bg-neutral-100'>
            <div className='flex h-full w-full'>
              <div
                className='bg-emerald-500'
                style={{ width: `${greenPct}%` }}
              />
              <div
                className='bg-amber-400'
                style={{ width: `${yellowPct}%` }}
              />
              <div className='bg-red-500' style={{ width: `${redPct}%` }} />
            </div>
          </div>
          <div className='mt-2.5 grid grid-cols-3 gap-2 text-[10px]'>
            <div className='text-center rounded-md bg-emerald-50 py-1 text-emerald-800 font-semibold'>
              {greenPct.toFixed(0)}% Healthy
            </div>
            <div className='text-center rounded-md bg-amber-50 py-1 text-amber-800 font-semibold'>
              {yellowPct.toFixed(0)}% Moderate
            </div>
            <div className='text-center rounded-md bg-red-50 py-1 text-red-800 font-semibold'>
              {redPct.toFixed(0)}% Stressed
            </div>
          </div>
          <button
            type='button'
            onClick={onOpenTrends}
            className='mt-2.5 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-md shadow-emerald-300/40 hover:bg-emerald-500 transition-colors'
            title='Open NDVI Trends'
          >
            View NDVI Trends
            <ChevronRight className='ml-1 h-3.5 w-3.5' />
          </button>
        </div>
      </div>

      <div className='rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200'>
        <div className='mb-2 flex items-center gap-1.5'>
          <Sparkles className='h-4 w-4 text-violet-600' />
          <h3 className='text-sm font-semibold text-neutral-900'>
            AI Snapshot
          </h3>
        </div>
        {truncatedSummary ? (
          <p className='text-sm leading-5 text-neutral-700'>
            {truncatedSummary}
          </p>
        ) : (
          <p className='text-sm text-neutral-500'>
            AI summary unavailable for this farm.
          </p>
        )}
        <div className='mt-2.5 space-y-1.5 text-[11px]'>
          {topIssue && (
            <p className='text-neutral-700'>
              <span className='text-neutral-500'>Top issue: </span>
              <span className='font-semibold text-amber-800'>
                {topIssue.name} ({Math.round(topIssue.affected_area_pct)}%)
              </span>
            </p>
          )}
          {immediateActions.length > 0 && (
            <p className='text-neutral-700'>
              <span className='text-neutral-500'>Next action: </span>
              <span className='font-semibold text-emerald-700'>
                {immediateActions[0]}
              </span>
            </p>
          )}
        </div>
        <div className='mt-2.5 flex items-center gap-4'>
          <button
            type='button'
            onClick={onOpenAnalysis}
            className='inline-flex items-center text-[11px] font-semibold text-sky-700 hover:text-sky-900'
          >
            View full analysis
            <ChevronRight className='ml-1 h-3.5 w-3.5' />
          </button>
        </div>
      </div>

      {!showDetails && (
        <div className='relative overflow-hidden rounded-xl border border-emerald-200/70 bg-gradient-to-b from-white to-emerald-50/40 p-2.5 shadow-sm'>
          <div className='pointer-events-none absolute inset-0 backdrop-blur-[1px]' />

          <div className='pointer-events-none absolute -bottom-10 left-0 right-0 h-28 bg-gradient-to-t from-emerald-300/50 via-emerald-200/25 to-transparent blur-2xl' />
          <div className='pointer-events-none absolute -bottom-3 left-8 right-8 h-10 rounded-full bg-emerald-300/25 blur-xl' />

          <div className='relative pb-10'>
            <div className='relative overflow-hidden p-0.5'>
              <div className='mb-1.5 flex items-center gap-1.5'>
                <Calendar className='h-3.5 w-3.5 text-sky-600' />
                <h3 className='text-xs font-semibold text-neutral-900'>
                  Crop Timeline
                </h3>
              </div>

              <div className='grid grid-cols-2 gap-1.5 text-[10px]'>
                <div className='rounded-md bg-sky-50 p-1.5'>
                  <p className='text-sky-700'>Planting</p>
                  <p className='font-semibold text-sky-900'>
                    {formatDate(farm.plantingDate)}
                  </p>
                </div>
                <div className='rounded-md bg-indigo-50 p-1.5'>
                  <p className='text-indigo-700'>Harvest</p>
                  <p className='font-semibold text-indigo-900'>
                    {formatDate(farm.harvestDate)}
                  </p>
                </div>
              </div>

              <div className='mt-1.5 space-y-0.5 text-[10px] text-neutral-700'>
                <p className='flex items-center gap-1'>
                  <Clock3 className='h-3 w-3' /> Stage:{' '}
                  <span className='font-semibold'>{cropStage}</span>
                </p>
                <p>
                  Remaining:{' '}
                  <span className='font-semibold'>
                    {isCycleCompleted ? 'Completed' : `${daysRemaining}d`}
                  </span>
                </p>
              </div>

              {isCycleCompleted ? (
                <div className='mt-1.5 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800'>
                  Harvest cycle completed
                </div>
              ) : (
                <div className='mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100'>
                  <div
                    className='h-full bg-sky-500'
                    style={{ width: `${cycleProgress}%` }}
                  />
                </div>
              )}

              <div className='pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/95 via-white/80 to-transparent backdrop-blur-[2px]' />
            </div>
          </div>

          <button
            type='button'
            onClick={() => setShowDetails(true)}
            className='absolute bottom-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-400/40 hover:bg-emerald-500 transition-colors'
          >
            More info
            <ChevronRight className='ml-1.5 h-4 w-4' />
          </button>
        </div>
      )}

      {showDetails && (
        <>
          <div className='flex justify-end -mt-1'>
            <button
              type='button'
              onClick={() => setShowDetails(false)}
              className='inline-flex items-center text-[11px] font-semibold text-neutral-600 hover:text-neutral-900'
            >
              Hide extra info
              <ChevronRight className='ml-1 h-3.5 w-3.5 rotate-90' />
            </button>
          </div>
          <div className='rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200'>
            <div className='mb-2.5 flex items-center justify-between gap-2'>
              <div className='flex items-center gap-1.5'>
                <Calendar className='h-4 w-4 text-sky-600' />
                <h3 className='text-sm font-semibold text-neutral-900'>
                  Crop Timeline
                </h3>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isCycleCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                {isCycleCompleted ? 'Completed' : 'In progress'}
              </span>
            </div>

            <div className='grid grid-cols-2 gap-2 text-xs'>
              <div className='rounded-lg border border-sky-100 bg-sky-50 p-2'>
                <p className='text-sky-700'>Planting</p>
                <p className='font-semibold text-sky-900'>
                  {formatDate(farm.plantingDate)}
                </p>
              </div>
              <div className='rounded-lg border border-indigo-100 bg-indigo-50 p-2'>
                <p className='text-indigo-700'>Harvest</p>
                <p className='font-semibold text-indigo-900'>
                  {formatDate(farm.harvestDate)}
                </p>
              </div>
            </div>

            <div className='mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]'>
              <div className='rounded-lg bg-neutral-50 p-2'>
                <p className='text-neutral-500'>Created</p>
                <p className='font-semibold text-neutral-900'>
                  {formatDate(farm.createdAt, 'dd MMM yyyy')}
                </p>
              </div>
              <div className='rounded-lg bg-neutral-50 p-2'>
                <p className='text-neutral-500'>Stage</p>
                <p className='font-semibold text-neutral-900'>{cropStage}</p>
              </div>
              <div className='rounded-lg bg-neutral-50 p-2'>
                <p className='text-neutral-500'>Days since planting</p>
                <p className='font-semibold text-neutral-900'>
                  {daysSincePlanting} days
                </p>
              </div>
              <div className='rounded-lg bg-neutral-50 p-2'>
                <p className='text-neutral-500'>Days remaining</p>
                <p className='font-semibold text-neutral-900'>
                  {isCycleCompleted ? 'Completed' : `${daysRemaining} days`}
                </p>
              </div>
            </div>

            {isCycleCompleted ? (
              <div className='mt-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-[11px] text-emerald-800'>
                <span className='font-semibold'>Harvest cycle completed</span>{' '}
                on {formatDate(farm.harvestDate, 'dd MMM yyyy')}.
              </div>
            ) : (
              <div className='mt-2.5'>
                <div className='mb-1 flex items-center justify-between text-[10px] text-neutral-600'>
                  <span>Cycle progress</span>
                  <span className='font-semibold text-neutral-800'>
                    {Math.round(cycleProgress)}%
                  </span>
                </div>
                <div className='h-2 overflow-hidden rounded-full bg-neutral-100'>
                  <div
                    className='h-full bg-sky-500'
                    style={{ width: `${cycleProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className='mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]'>
              <div className='rounded-lg bg-neutral-50 p-2'>
                <p className='text-neutral-500'>Area</p>
                <p className='font-semibold text-neutral-900'>
                  {formatArea(farm.area)}
                </p>
              </div>
              <div className='rounded-lg bg-neutral-50 p-2'>
                <p className='text-neutral-500'>Boundary points</p>
                <p className='font-semibold text-neutral-900'>
                  {boundaryPoints}
                </p>
              </div>
            </div>

            <button
              type='button'
              onClick={onViewOnMap}
              className='mt-2.5 inline-flex items-center text-[11px] font-semibold text-sky-700 hover:text-sky-900'
            >
              View on map
              <ChevronRight className='ml-1 h-3.5 w-3.5' />
            </button>
          </div>

          <div className='rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200'>
            <div className='mb-2.5 flex items-center gap-1.5'>
              <Navigation className='h-4 w-4 text-rose-600' />
              <h3 className='text-sm font-semibold text-neutral-900'>
                Location Details
              </h3>
            </div>
            <div className='space-y-2 text-sm text-neutral-700'>
              <p className='rounded-lg bg-neutral-50 p-2'>
                {location?.complete_address || 'Address unavailable'}
              </p>
              <div className='grid grid-cols-2 gap-2 text-xs'>
                <div className='rounded-lg bg-neutral-50 p-2'>
                  <p className='text-neutral-500'>Latitude</p>
                  <p className='font-semibold text-neutral-800'>
                    {location?.coordinates?.latitude?.toFixed(5) ?? 'N/A'}
                  </p>
                </div>
                <div className='rounded-lg bg-neutral-50 p-2'>
                  <p className='text-neutral-500'>Longitude</p>
                  <p className='font-semibold text-neutral-800'>
                    {location?.coordinates?.longitude?.toFixed(5) ?? 'N/A'}
                  </p>
                </div>
              </div>
              <button
                type='button'
                onClick={onViewOnMap}
                className='inline-flex items-center text-[11px] font-semibold text-sky-700 hover:text-sky-900'
              >
                View on map
                <ChevronRight className='ml-1 h-3.5 w-3.5' />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
