#include <cassert>
#include "ola/messaging/Descriptor.h"
int main() {
  typedef ola::messaging::UInt16FieldDescriptor Descriptor;
  Descriptor::IntervalVector intervals;
  intervals.push_back(Descriptor::Interval(2, 8));
  Descriptor::LabeledValues labels;
  labels["special"] = 15;
  Descriptor descriptor("value", intervals, labels);
  assert(descriptor.IsValid(2));
  assert(descriptor.IsValid(15));
  assert(!descriptor.IsValid(16));
}
