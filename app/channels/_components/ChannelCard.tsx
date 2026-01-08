import Link from 'next/link';

type ChannelStatus = 'active' | 'pending' | 'closed';

interface ChannelCardProps {
  channel: {
    id: string;
    name: string;
    status: ChannelStatus;
    participants: number;
    balance: string;
  };
}

const statusStyles: Record<ChannelStatus, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-gray-100 text-gray-800',
};

export function ChannelCard({ channel }: ChannelCardProps) {
  return (
    <Link
      href={`/channels/${channel.id}`}
      className="block rounded-xl border border-[var(--border)] p-6 transition-colors hover:bg-[var(--muted)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{channel.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {channel.participants} participants
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm">{channel.balance} TON</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[channel.status]}`}
          >
            {channel.status}
          </span>
        </div>
      </div>
    </Link>
  );
}

