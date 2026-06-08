import vheraTagLogo from '../assets/brand/vhera-tag-logo.png';

type BrandSignatureProps = {
  compact?: boolean;
  align?: 'start' | 'center';
  theme?: 'light' | 'dark';
  showTagline?: boolean;
};

function BrandSignature({
  compact = false,
  align = 'start',
  theme = 'light',
  showTagline = true
}: BrandSignatureProps) {
  const className = [
    'brand-signature',
    compact ? 'is-compact' : '',
    align === 'center' ? 'is-center' : '',
    theme === 'dark' ? 'is-dark' : 'is-light'
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <img src={vheraTagLogo} alt="Vhera Tag - Logo" className="brand-signature__logo" />
      <div className="brand-signature__content">
        <div className="brand-signature__name-wrap">
          <span className="brand-signature__name">Vhera Tag</span>
          <span className="brand-signature__chip">ESL</span>
        </div>
        {showTagline ? <p className="brand-signature__tagline">Etiquetas Digitais</p> : null}
      </div>
    </div>
  );
}

export default BrandSignature;
