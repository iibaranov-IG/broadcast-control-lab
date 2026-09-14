# Linux Show Player OSC interface selection

This case covers [Linux Show Player issue #398](https://github.com/FrancescoCeruti/linux-show-player/issues/398).

The unchanged regression fails because the OSC settings expose only a computed label and `OscServer` always binds to that computed address. The repair adds an IPv4 interface selector, keeps remote destination settings separate, preserves the legacy default and restarts the listener with the selected bind tuple.

The reporter's Debian system with two live networks remains the final application check.
