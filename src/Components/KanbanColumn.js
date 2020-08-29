import React from "react";
import CardModal from "./CardModal";

export default function KanbanColumn() {
  return (
    <div className="column">
      <div className="column-title">
        <h2>Open</h2>
      </div>
      <div className="column-contents">
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
        < CardModal />
      </div>
    </div>
  );
}
