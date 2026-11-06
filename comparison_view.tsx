import React, { useContext, useMemo } from "react";
import {
  type Comparison,
  our_syllables,
  tally,
  toki_pona_syllables,
} from "./comparison";
import { tokenize } from "./examples";
import { pronounce } from "./phonology";
import { Phrase, PhonologyContext, WordHover } from "./word_ui";

export function TallyLine({ rows }: { rows: Comparison[] }) {
  const t = useMemo(() => tally(rows), [rows]);
  return (
    <p className="text-sm mb-2">
      We can say <span className="font-semibold">{t.covered}</span> of {t.total}
      {t.loose > 0 && ` (${t.loose} loosely)`}. Where both can: ours is shorter for{" "}
      <span className="font-semibold text-green-700">{t.shorter}</span>, the same for{" "}
      <span className="font-semibold">{t.same}</span> and longer for{" "}
      <span className="font-semibold text-red-600">{t.longer}</span>, {t.our_syllables} syllables
      against Toki Pona's {t.their_syllables}.
    </p>
  );
}

export function ComparisonTable({ rows }: { rows: Comparison[] }) {
  const phonology = useContext(PhonologyContext);
  return (
    <table className="text-sm border-collapse">
      <thead>
        <tr className="text-left text-gray-500">
          <th className="pr-3 font-normal">English</th>
          <th className="pr-3 font-normal">Ours</th>
          <th className="pr-3 font-normal">Sound</th>
          <th className="pr-3 font-normal">Syl.</th>
          <th className="pr-3 font-normal">Toki Pona</th>
          <th className="font-normal">Syl.</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const ours = our_syllables(row.ours);
          const theirs = toki_pona_syllables(row.toki_pona);
          const sound =
            ours === undefined
              ? []
              : tokenize(row.ours).flatMap((t, i) =>
                  t.kind === "word" && t.word
                    ? [
                        i > 0 ? " " : "",
                        <WordHover key={i} word={t.word}>
                          <span className="cursor-default hover:underline decoration-dotted">
                            {pronounce(t.word, phonology)}
                          </span>
                        </WordHover>,
                      ]
                    : [],
                );
          const compare =
            ours === undefined || theirs === undefined
              ? ""
              : ours < theirs
                ? "text-green-700"
                : ours > theirs
                  ? "text-red-600"
                  : "";
          return (
            <tr key={`${row.english}-${row.toki_pona}`} className="border-t border-gray-100">
              <td className="pr-3 py-0.5">{row.english}</td>
              <td className={`pr-3 py-0.5 ${ours === undefined ? "bg-red-50 text-red-600" : ""}`}>
                {ours === undefined ? "—" : <Phrase text={row.ours} />}
                {row.loose && (
                  <span className="ml-1 text-xs text-amber-700" title="A near miss">
                    loose
                  </span>
                )}
              </td>
              <td className="pr-3 py-0.5 font-mono text-indigo-800">{sound}</td>
              <td className={`pr-3 py-0.5 text-right ${compare}`}>{ours ?? ""}</td>
              <td className="pr-3 py-0.5 italic">{row.toki_pona || "—"}</td>
              <td className="py-0.5 text-right">{theirs ?? ""}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
