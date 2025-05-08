import { createRoot } from "react-dom/client";
import { dictionary, is_root, roots, words, domains, Word } from "./dict";

console.log(dictionary, roots);

function WordPreview({ word }: { word: Word }) {
  const is_root_word = is_root(word);
  return (
    <div className="border-2 bg-amber-50 px-2">
      <div>
        <b>{word.word}</b>
      </div>
      <div>{is_root_word ? "ROOT" : "COMPOUND"}</div>
      <div>
        {word.data.t.map((tag) => (
          <span>{tag} </span>
        ))}
      </div>
      {word.data.domain && <div>Domain: {word.data.domain}</div>}
      {!is_root_word && (
        <div>
          {word.data.parts?.map((part) => (
            <span>{part} </span>
          ))}
        </div>
      )}
    </div>
  );
}

function WordList({ words }: { words: Word[] }) {
  return (
    <div>
      {words.map((word) => (
        <WordPreview key={word.word} word={word} />
      ))}
    </div>
  );
}

function App() {
  console.log(words, dictionary, domains);
  return (
    <div>
      <h1>Hello React + Bun!</h1>
      <WordList words={words} />
    </div>
  );
}

const container = document.getElementById("app")!;
const root = createRoot(container);
root.render(<App />);
