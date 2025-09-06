import { Fragment } from 'react';

interface Props {
  text: string;
  query: string;
}

/**
 * Component to highlight search query in text
 */
export function Highlight({ text, query }: Props) {
  if (!query) {
    return <>{text}</>;
  }

  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig')
  );

  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i % 2 === 1 ? (
            <mark className="bg-yellow-100 px-0.5">{part}</mark>
          ) : (
            part
          )}
        </Fragment>
      ))}
    </>
  );
}
