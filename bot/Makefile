CC ?= gcc

CONCORD_DIR          = concord
CONCORD_LIBDIR       = $(CONCORD_DIR)/lib
CONCORD_INCLUDEDIR   = $(CONCORD_DIR)/include
CONCORD_COREDIR	     = $(CONCORD_DIR)/core
CONCORD_GENCODECSDIR = $(CONCORD_DIR)/gencodecs

SRCDIR     = src
INCLUDEDIR = include

CONCORD_LIB = $(CONCORD_LIBDIR)/libdiscord.a
OBJS        = $(SRCDIR)/tccbot_context.o              \
              $(SRCDIR)/tccbot_dashboard.o            \
              $(SRCDIR)/tccbot_dashboard-events.o     \
              $(SRCDIR)/tccbot_interactions-handler.o

SETUP = setup
MAIN  = main

CFLAGS  = -Wall -Wextra -O0 -g -I$(INCLUDEDIR)         \
          -I$(CONCORD_INCLUDEDIR) -I$(CONCORD_COREDIR) \
		  -I$(CONCORD_GENCODECSDIR)
LDFLAGS = -L$(CONCORD_LIBDIR)
LDLIBS  = -lcurl -ldiscord

all: $(MAIN) $(SETUP)

$(MAIN): $(OBJS)
$(SETUP): $(OBJS)

$(OBJS): $(CONCORD_LIB)
	$(MAKE) -C $(SRCDIR)

$(CONCORD_LIB): submodules

submodules:
	@ git submodule update --init --recursive
	@ $(MAKE) -C $(CONCORD_DIR)

echo:
	@ echo "CC: $(CC)"
	@ echo "CONCORD_DIR: $(CONCORD_DIR)"
	@ echo "CONCORD_LIBDIR: $(CONCORD_LIBDIR)"
	@ echo "CONCORD_INCLUDEDIR: $(CONCORD_INCLUDEDIR)"
	@ echo "CONCORD_COREDIR: $(CONCORD_COREDIR)"
	@ echo "CONCORD_GENCODECSDIR: $(CONCORD_GENCODECSDIR)"
	@ echo "SRCDIR: $(SRCDIR)"
	@ echo "INCLUDEDIR: $(INCLUDEDIR)"
	@ echo "CFLAGS: $(CFLAGS)"
	@ echo "LDFLAGS: $(LDFLAGS)"
	@ echo "LDLIBS: $(LDLIBS)"
	@ echo "CONCORD_LIB: $(CONCORD_LIB)"
	@ echo "OBJS: $(OBJS)"
	@ echo "MAIN: $(MAIN)"
	@ echo "SETUP: $(SETUP)"

clean:
	@ rm -f $(MAIN) $(SETUP)

purge: clean
	@ $(MAKE) -C $(CONCORD_DIR) $@

.PHONY: echo clean purge submodules
