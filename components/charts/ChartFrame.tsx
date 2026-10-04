import { ReactNode } from "react";

interface ChartFrameProps {
  label: string;
  columns: string[];
  rows: (string | number)[][];
  children: ReactNode;
}

// Envuelve una gráfica de Recharts: el SVG se anuncia como imagen con una descripción y los datos
// quedan disponibles para lectores de pantalla en una tabla oculta visualmente.
export function ChartFrame({ label, columns, rows, children }: ChartFrameProps) {
  return (
    <>
      <div role="img" aria-label={label}>
        {children}
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
