# Thingino firmware #1655

Thingino can execute ONVIF FOV-relative moves, but its profile and PTZ
configuration responses always declare GenericSpace as the default. Frigate
therefore removes `pt-r-fov` and disables autotracking.

The root repair lives in the pinned `themactep/thingino-onvif` package. It selects
TranslationSpaceFov only when both configured FOV dimensions are positive and
uses that value in all five templates and fourteen render calls. Cameras without
complete FOV geometry retain the existing GenericSpace declaration.
