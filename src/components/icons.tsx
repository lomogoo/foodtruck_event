import type { SVGProps } from 'react'

/**
 * 画面で使うアイコンはすべてここに置く。
 *
 * 絵文字はフォント依存で見た目が端末ごとに変わり、色も線幅も揃わない。
 * 24×24 のグリッド・線幅1.6・currentColor で統一したストロークアイコンにして、
 * 文字と同じ濃度で並ぶようにしている。
 */

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number
}

function Icon({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const TruckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.6 16.4V7.9A1.4 1.4 0 0 1 4 6.5h9a1.4 1.4 0 0 1 1.4 1.4v8.5" />
    <path d="M14.4 10.4h3.2a1.5 1.5 0 0 1 1.2.6l2 2.8a1.5 1.5 0 0 1 .3.9v1.7" />
    <path d="M2.6 16.4h1.5M8.4 16.4h5.6M19.8 16.4h1.6" />
    <circle cx="6.2" cy="16.8" r="2.1" />
    <circle cx="17.3" cy="16.8" r="2.1" />
    <path d="M5.2 9.8h6.2" />
  </Icon>
)

export const ClipboardIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 4.5h6a1 1 0 0 1 1 1v1H8v-1a1 1 0 0 1 1-1Z" />
    <path d="M16 6.2h2a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V7.7A1.5 1.5 0 0 1 6 6.2h2" />
    <path d="M8.5 11.5h7M8.5 15.5h4.5" />
  </Icon>
)

export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
  </Icon>
)

export const InboxIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 13.5h4l1.2 2.4a1 1 0 0 0 .9.6h4.8a1 1 0 0 0 .9-.6l1.2-2.4h4" />
    <path d="M6.2 4.5h11.6a1.5 1.5 0 0 1 1.4 1l2.3 7v5a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-5l2.3-7a1.5 1.5 0 0 1 1.4-1Z" />
  </Icon>
)

export const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.8" y="5" width="18.4" height="14" rx="2" />
    <path d="m3.4 7 7.7 5.4a1.5 1.5 0 0 0 1.8 0L20.6 7" />
  </Icon>
)

export const SparkleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5c.7 3.7 1.6 4.6 5.3 5.3-3.7.7-4.6 1.6-5.3 5.3-.7-3.7-1.6-4.6-5.3-5.3 3.7-.7 4.6-1.6 5.3-5.3Z" />
    <path d="M17.8 15c.35 1.85.8 2.3 2.65 2.65-1.85.35-2.3.8-2.65 2.65-.35-1.85-.8-2.3-2.65-2.65 1.85-.35 2.3-.8 2.65-2.65Z" />
  </Icon>
)

export const FolderIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 7.5a2 2 0 0 1 2-2h3.3a2 2 0 0 1 1.5.7l1 1.2a2 2 0 0 0 1.5.7h5.7a2 2 0 0 1 2 2v7.4a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5Z" />
  </Icon>
)

export const PaperclipIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 11.3 12.2 18a4.2 4.2 0 0 1-6-6l7.3-7.3a2.8 2.8 0 0 1 4 4l-7.3 7.3a1.4 1.4 0 0 1-2-2l6.6-6.6" />
  </Icon>
)

export const FileTextIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5Z" />
    <path d="M13.5 3.5v5h5M8.8 13h6.4M8.8 16.4h4.4" />
  </Icon>
)

export const ImageIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m4.2 17.2 4.3-4.3a1.5 1.5 0 0 1 2.1 0l3.1 3.1a1.5 1.5 0 0 0 2.1 0l1.4-1.4a1.5 1.5 0 0 1 2.1 0l2.1 2.1" />
  </Icon>
)

export const TableIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M3.5 14.5h17M10 9.5v10" />
  </Icon>
)

export const FileEditIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M18.5 11V8.5l-5-5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h4" />
    <path d="M13.5 3.5v5h5" />
    <path d="m19.4 14.1 1.5 1.5-4.6 4.6-2 .5.5-2Z" />
  </Icon>
)

export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Icon>
)

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Icon>
)

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
)

export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.8v4.9M12 16.1v.01" />
  </Icon>
)
