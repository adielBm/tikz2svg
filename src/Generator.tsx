import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import tikzjaxJs from "./tikzjax.js?raw"; // For Vite (bundler must support ?raw)
import Editor from "react-simple-code-editor";
import "prismjs/themes/prism.css";
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-latex';
import 'prismjs/components/prism-ada';

const Generator: React.FC = () => {

  const [tikzCode, setTikzCode] = useState<string>(`\\usepackage{color,graphicx,circuitikz}
\\begin{document}
\\begin{circuitikz}[american, thick]
\\draw (0,0) to [C, l={$C$}](2,0);
\\end{circuitikz}
\\end{document}`);
  const tikzDiagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      renderTikz(tikzCode);
    }, 1000);
    return () => clearTimeout(handler);
  }, [tikzCode]);

  useEffect(() => {
    const script = document.createElement("script");
    script.id = "tikzjax";
    script.type = "text/javascript";
    script.innerText = tikzjaxJs;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);


  const renderTikz = (code: string | null) => {
    if (!window.tikzjax) {
      console.error(window.tikzjax);
    }
    // In a real implementation, we'd need to handle TikZJax rendering here
    if (tikzDiagramRef.current && window.tikzjax) {
      // Clear previous diagram
      tikzDiagramRef.current.innerHTML = '';

      // Create a script element with the TikZ code
      const script = document.createElement('script');
      script.setAttribute('type', 'text/tikz');
      script.setAttribute('data-show-console', 'true');
      script.textContent = code;

      // Append the script to the diagram container
      tikzDiagramRef.current.appendChild(script);

      // Trigger TikZJax to render the diagram
      try {
        window.tikzjax.process(tikzDiagramRef.current);
      } catch (error) {
        console.error('Error rendering TikZ diagram:', error);
      }
    }
  }

  const exportSVG = () => {
    const svg = document.querySelector("#tikzDiagram svg");
    if (svg) {
      let fontFaceRules = "";

      [...document.styleSheets].forEach(sheet => {
        try {
          [...sheet.cssRules].forEach(rule => {
            if (/cmr10|cmmi10/.test(rule.cssText)) fontFaceRules += rule.cssText + "\n";
          });
        } catch (err) { /* Ignore errors for cross-origin stylesheets */ }
      });

      const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
      styleElement.textContent = fontFaceRules;
      svg.prepend(styleElement);

      // Add TikZ source as a comment at the top of the SVG
      const tikzComment = document.createComment(` TikZ source:\n${tikzCode.replace(/\-\-/g, "–")} `);
      svg.insertBefore(tikzComment, svg.firstChild);

      const svgString = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const a = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: "exported.svg"
      });

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }
  };

  return (
    <div className="container mx-auto p-2 max-w-3xl">
      <h1 className="font-bold text-center">tikz2svg</h1>
      <hr className="my-4" />
      <Editor
        id="tikz-editor"
        className="mt-6"
        value={tikzCode}
        onValueChange={(code) => setTikzCode(code)}
        highlight={(code) => highlight(code, languages.latex, 'latex')}
        padding={10}
        style={{ fontFamily: "monospace", backgroundColor: "white" }}
      />
      <div id="tikzDiagram" ref={tikzDiagramRef} className={`mt-6 p-4 bg-white rounded-lg flex justify-center`} ></div>
      <div className="flex justify-center space-x-4 mt-4">

        <button
          className="px-4 py-2 rounded-lg bg-blue-300 cursor-pointer"
          type="button"
          id="exportSVG"
          onClick={exportSVG}
        >
          Export SVG
        </button>
      </div>
      <hr className="my-4" />

      <footer className="text-center m-8 text-gray-500">
        <div>
          source code: <a
            href="https://github.com/adielBm/tikz2svg/"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/adielBm/tikz2svg
          </a>
        </div>

      </footer>
    </div>
  );
};

export default Generator;