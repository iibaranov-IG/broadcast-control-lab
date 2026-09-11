#include "jack/jack.h"

struct jack_client { int unused; };
struct jack_port { int unused; };

static struct jack_client client;
static struct jack_port port;
static jack_default_audio_sample_t buffer[4096];

jack_client_t* jack_client_open(const char* name, jack_options_t options, jack_status_t* status, const char* server) {
    (void)name; (void)options; (void)status; (void)server;
    return &client;
}
int jack_client_close(jack_client_t* value) { (void)value; return 0; }
const char* jack_get_client_name(jack_client_t* value) { (void)value; return "bcl"; }
jack_port_t* jack_port_register(jack_client_t* value, const char* name, const char* type, unsigned long flags, unsigned long size) {
    (void)value; (void)name; (void)type; (void)flags; (void)size;
    return &port;
}
int jack_port_connected(const jack_port_t* value) { (void)value; return 0; }
void* jack_port_get_buffer(jack_port_t* value, jack_nframes_t frames) { (void)value; (void)frames; return buffer; }
int jack_set_process_callback(jack_client_t* value, int (*callback)(jack_nframes_t, void*), void* data) {
    (void)value; (void)callback; (void)data; return 0;
}
int jack_set_port_connect_callback(jack_client_t* value, void (*callback)(jack_port_id_t, jack_port_id_t, int, void*), void* data) {
    (void)value; (void)callback; (void)data; return 0;
}
int jack_set_sample_rate_callback(jack_client_t* value, int (*callback)(jack_nframes_t, void*), void* data) {
    (void)value; (void)callback; (void)data; return 0;
}
int jack_set_buffer_size_callback(jack_client_t* value, int (*callback)(jack_nframes_t, void*), void* data) {
    (void)value; (void)callback; (void)data; return 0;
}
int jack_activate(jack_client_t* value) { (void)value; return 0; }
