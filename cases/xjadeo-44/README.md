# Set WM_CLASS for every Linux video window

Issue: https://github.com/x42/xjadeo/issues/44

The regression test covers native X11, GLX and SDL 1.2 window creation. The candidate also passes a full Linux build and a runtime `xprop WM_CLASS` check under Xvfb.
