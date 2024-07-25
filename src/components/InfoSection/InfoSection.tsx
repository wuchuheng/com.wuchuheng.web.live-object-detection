import React from "react";

export const InfoSection = () => {
  return (
    <section className="info-section">
      <div id="detected-objects">
        <h2>Detected Objects</h2>
        <div id="object-list"></div>
      </div>
      <div id="notifications">
        <h2>Notifications</h2>
        <p id="notification-message">No objects detected yet.</p>
      </div>
    </section>
  );
};
