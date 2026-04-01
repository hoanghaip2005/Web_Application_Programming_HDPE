function SectionTitle({ eyebrow, title, description = "", meta = "" }) {
  return (
    <div className="section-title">
      <div className="section-title__copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {meta ? <span className="tag section-title__meta">{meta}</span> : null}
    </div>
  );
}

export default SectionTitle;
