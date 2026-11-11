import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Search } from 'lucide-react';
import { Empty } from './ui';

/**
 * Two-pane methodology view: a grouped step list on the left and the selected
 * step's tool pane on the right. The selected step lives in the URL hash
 * (#/section/step) so it survives reloads and can be linked.
 *
 * groups: [{ label, steps: [{ id, label, component?, count?, hot? }] }]
 */
export default function Methodology({ section, title, description, groups, thisFqdn, toolbar }) {
  const steps = useMemo(() => groups.flatMap((g) => g.steps.map((s) => ({ ...s, group: g.label }))), [groups]);
  const firstWithTool = steps.find((s) => s.component) || steps[0];
  const fromHash = () => {
    const id = window.location.hash.replace(/^#\/?/, '').split('/')[1];
    return steps.find((s) => s.id === id) ? id : firstWithTool?.id;
  };
  const [active, setActive] = useState(fromHash);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onHash = () => setActive(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  const select = (id) => {
    window.history.replaceState(null, '', `#/${section}/${id}`);
    setActive(id);
    document.querySelector('.b-work')?.scrollTo(0, 0);
  };

  const current = steps.find((s) => s.id === active) || firstWithTool;
  const Tool = current?.component;
  const q = query.trim().toLowerCase();
  const built = steps.filter((s) => s.component).length;

  return (
    <div className="b-method">
      <aside className="b-steps">
        <div className="b-steps-head">
          <h1>{title}</h1>
          {description && <p>{description}</p>}
          <span className="b-steps-meta">{built} of {steps.length} steps have a guide</span>
          {steps.length > 8 && (
            <label className="b-steps-search">
              <Search size={14} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter steps" />
            </label>
          )}
        </div>
        <nav className="b-steps-list">
          {groups.map((group) => {
            const visible = group.steps.filter((s) => !q || s.label.toLowerCase().includes(q));
            if (!visible.length) return null;
            return (
              <div className="b-step-group" key={group.label}>
                <div className="b-step-group-label">{group.label}</div>
                {visible.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`b-step ${s.id === current?.id ? 'active' : ''} ${s.component ? '' : 'planned'}`}
                    onClick={() => select(s.id)}
                    aria-current={s.id === current?.id ? 'step' : undefined}
                  >
                    <span className="b-step-label">{s.label}</span>
                    {s.count !== undefined && <em className={s.hot ? 'hot' : ''}>{s.count}</em>}
                    {!s.component && <small>planned</small>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      <section className="b-work">
        {toolbar}
        {current && (
          <header className="b-work-head">
            <div className="b-crumbs">{title}<ChevronRight size={13} />{current.group}</div>
            <h2>{current.label}</h2>
          </header>
        )}
        <div className="b-tool">
          {Tool ? (
            <Tool key={`${thisFqdn?._id}:${current.id}`} thisFqdn={thisFqdn} {...(current.props || {})} />
          ) : (
            <Empty icon={<BookOpen size={20} />} title="No guide for this step yet">
              This step is part of the methodology but nobody has written its tool guide. Test it by hand and keep your notes in the target's data.
            </Empty>
          )}
        </div>
      </section>
    </div>
  );
}
