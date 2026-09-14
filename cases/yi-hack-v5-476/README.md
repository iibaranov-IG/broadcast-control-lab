# YI Hack v5 #476

This case executes the production PTZ JavaScript module behind a minimal DOM and jQuery boundary.

The baseline fails because no handlers exist for the add and delete controls. The candidate must register all three controls and produce the existing CGI requests with representative form values.

The BCL test is excluded from publication. A YI Dome owner still needs to verify that the resulting CGI operations persist and recall physical camera positions.
