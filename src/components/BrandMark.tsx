export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <div className={small ? 'brand-mark brand-mark--small' : 'brand-mark'} aria-hidden>
      <span />
      <i />
    </div>
  );
}
