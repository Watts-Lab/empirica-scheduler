export const surveyLinkHTML = `
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <script
      type="text/javascript"
      src="https://s3.amazonaws.com/mturk-public/externalHIT_v1.js"
    ></script>
    <script>
      const studyURL = "{{studyURLField}}";
      const urlParams = new URLSearchParams(window.location.search);
      const fullStudyURL = \`\${studyURL.toString()}?\${urlParams.toString()}\`;
      const submitToHost = turkGetSubmitToHost();
    </script>
  </head>
  <body>
    <form
      name="mturk_form"
      method="post"
      id="mturk_form"
      action="https://www.mturk.com/mturk/externalSubmit"
    >
      <input type="hidden" value="" name="assignmentId" id="assignmentId" />

      <div
        class="container"
        id="SurveyLink"
        style="
          margin-bottom: 15px;
          padding: 10px 10px;
          font-family: Verdana, Geneva, sans-serif;
          color: #333333;
          font-size: 0.9em;
          text-align: center;
        "
      >
        <div>
          <img
            src="https://deliberation-assets.nyc3.cdn.digitaloceanspaces.com/shared%2Fpenn_css_logo.png"
            width="250"
          />
          <br />
          <h1>The study you signed up for is now live!</h1>
          <p>
            <strong
              >Make sure to leave this window open as you complete the study.
            </strong>
          </p>
          <p>
            You will return to this window after the study and paste a code into
            the box.
          </p>

          <div
            id="surveyLinkElement"
            style="display: inline; font-family: Verdana"
          >
            <p>
              URL not shown: there is an error running JavaScript in this page.
            </p>
          </div>
          <br />
          <div style="margin-top: 10">
            <input
              class="form-control"
              id="surveycode"
              name="surveycode"
              placeholder="Afterwards, please enter the completion code here"
              type="text"
              size="50"
            />
            <input type="submit" id="submitButton" value="Submit" />
          </div>
        </div>
      </div>
    </form>

    <script language="Javascript">
      turkSetAssignmentID();

      // update survey link after accepting HIT
      const surveyLinkField = document.getElementById("surveyLinkElement");
      if (!urlParams.get("workerId")) {
        surveyLinkField.innerHTML = \`<h2><span style="color: rgb(255, 0, 0);">The link will appear here after you accept this HIT.</span></h2>\`;
      } else {
        surveyLinkField.innerHTML = \`<a target="_blank" href="\${fullStudyURL}"><h1><span style="color: rgb(0, 0, 255);"><b>Click here to begin!</b></span></h1></a>\`;
      }

      // update form submission action with the turkSubmitTo url parameter
      const formField = document.getElementById("mturk_form");
      formField.action = submitToHost + "/mturk/externalSubmit";
    </script>
  </body>
</html>
`;
