#ifndef BCL_JACK_STUB_H
#define BCL_JACK_STUB_H

#include <stdint.h>

typedef uint32_t jack_nframes_t;
typedef uint32_t jack_port_id_t;
typedef uint32_t jack_options_t;
typedef uint32_t jack_status_t;
typedef float jack_default_audio_sample_t;
typedef struct jack_client jack_client_t;
typedef struct jack_port jack_port_t;

#define JackNoStartServer 1
#define JackPortIsInput 1
#define JackPortIsOutput 2
#define JACK_DEFAULT_AUDIO_TYPE "32 bit float mono audio"

jack_client_t* jack_client_open(const char*, jack_options_t, jack_status_t*, const char*);
int jack_client_close(jack_client_t*);
const char* jack_get_client_name(jack_client_t*);
jack_port_t* jack_port_register(jack_client_t*, const char*, const char*, unsigned long, unsigned long);
int jack_port_connected(const jack_port_t*);
void* jack_port_get_buffer(jack_port_t*, jack_nframes_t);
int jack_set_process_callback(jack_client_t*, int (*)(jack_nframes_t, void*), void*);
int jack_set_port_connect_callback(jack_client_t*, void (*)(jack_port_id_t, jack_port_id_t, int, void*), void*);
int jack_set_sample_rate_callback(jack_client_t*, int (*)(jack_nframes_t, void*), void*);
int jack_set_buffer_size_callback(jack_client_t*, int (*)(jack_nframes_t, void*), void*);
int jack_activate(jack_client_t*);

#endif
